// #include <Arduino.h>
#include "drive_wheel.h"
#include "../../common/util/math.h"
#include "../../common/string/strcopy.h"
#include "../../rover/pose.h"

history_type _historyDefault = {0, 0}; // default value for empty history 

/**
 * Get the motor stall value.
 * This is the pwm value below which the motor will stall,
 * and so shoud correspond to pwm of minimal velocity
 * for the motor.
 */
float DriveWheel::stall() // RET: the fraction (0 to 1.0) of max pwm 
                          //      below which the motor will stall
{
    if(nullptr != _motor) {
        return (float)_motor->stallPwm() / _motor->maxPwm();
    }
    return 0;
}

/**
 * Set the measured motor stall value
 * This is the pwm value below which the motor will stall,
 * and so shoud correspond to pwm of minimal velocity
 * for the motor.
 */
DriveWheel& DriveWheel::setStall(
    float stall) // IN : (0 to 1.0) fraction of maximum pwm 
                 //      below which motor will stall
                 // RET: this DriveWheel
{
    if(nullptr != _motor) {
        _motor->setStallPwm(int(stall * _motor->maxPwm()));
    }

    return *this;
}


/**
 * Get the circumference of the wheel
 */
distance_type DriveWheel::circumference()   // RET: circumference passed to constructor
{
    return this->_circumference;
}

/**
 * Deteremine if drive wheel's dependencies are attached
 */
bool DriveWheel::attached() {
    return (NULL != _motor);
}

/**
 * Attach drive wheel dependencies
 */
DriveWheel& DriveWheel::attach(
    MotorL9110s &motor,         // IN : left wheel's motor
    Encoder *encoder,           // IN : pointer to the wheel encoder
                                //      or NULL if encoder not used
    int pulsesPerRevolution,    // IN : encoder pulses in one wheel turn
    MessageBus *messageBus)     // IN : pointer to MessageBus to publish state changes
                                //      or NULL to not publish state changes
                                // RET: this wheel in attached state
{
    if(!attached()) {
        // motors should already be in attached state
        _motor = &motor;

        _pulsesPerRevolution = 0;
        if(NULL != (_encoder = encoder)) {
            // attach encoder to it's input pin
            _encoder->attach();
            _pulsesPerRevolution = pulsesPerRevolution;
        }

        _messageBus = messageBus;
    }

    return *this;
}

/**
 * Detach drive wheel dependencies
 */
DriveWheel& DriveWheel::detach() // RET: this drive wheel in detached state
{
    if(attached()) {
        halt();

        _motor = NULL;

        if(NULL != _encoder) {
            // detach encoder from it's input pin
            _encoder->detach();
            _encoder = NULL;
        }

        _messageBus = NULL;
    }

    return *this;
}

/**
 * Set speed control parameters
 */
DriveWheel& DriveWheel::setSpeedControl(
    speed_type minSpeed,    // IN : minimum speed of motor below which it stalls
    speed_type maxSpeed,    // IN : maximum speed of motor
    float Kp,               // IN : proportional gain
    float Ki,               // IN : integral gain
    float Kd)               // IN : derivative gain
                            // RET: this DriveWheel
{
    _minSpeed = minSpeed;
    _maxSpeed = maxSpeed;
    _Kp = Kp;
    _Ki = Ki;
    _Kd = Kd;

    return *this;
}

/**
 * Read wheel encoder count.
 * This is a signed value that increases or descreased 
 * depending on the direction of the wheel.
 */
encoder_count_type DriveWheel::encoderCount() // RET: wheel encoder count
{
    return (attached() && (NULL != _encoder)) ? _encoder->count() : 0;
}

/**
 * Read wheel encoder ticks.
 * This is a unsigned value that increments without
 * regard for the the direction of the wheel.
 */
encoder_count_type DriveWheel::encoderTicks() // RET: wheel encoder count
{
    return (attached() && (NULL != _encoder)) ? _encoder->ticks() : 0;
}


/**
 * Immediately stop the rover and disengage speed control
 * if it is engaged (if setSpeed() has been called)
 */
DriveWheel& DriveWheel::halt() // RET: this drive wheel
{
    // disengage speed control
    this->_history.truncateTo(0);
    this->_lastSpeed = 0;
    this->_useSpeedControl = false;

    // stop the wheel
    _setPwm(true, 0);

    // publish halt message
    if(NULL != _messageBus) {
        publish(*_messageBus, WHEEL_HALT, specifier());
    }

    return *this;
}


/**
 * Send pwm and direction to left wheel.
 */
DriveWheel& DriveWheel::_setPwm(
        bool forward,   // IN : true to move wheel in forward direction
                        //      false to move wheel in reverse direction
        pwm_type pwm)   // IN : pwm for drive motor
                        // RET: this drive wheel
{
    if (attached()) {
        // set pwm if it changes
        pwm = bound<pwm_type>(pwm, 0, _motor->maxPwm());
        const bool directionChanged = _motor->forward() != forward;
        const bool pwmChanged = _motor->pwm() != pwm;
        if(directionChanged || pwmChanged) {
            //
            // if we are changing direction or starting from a stop,
            // then shorten history so speed control is more responsive
            //
            if(directionChanged || (0 == _motor->pwm())) {
                if(_history.count() > 0) {
                    // keep most recent entry, throw away the rest
                    _history.truncateTo(1);
                }
            }

            _motor->setPower(forward, pwm);

            // set encoder direction to match
            if(NULL != _encoder) {
                _encoder->setDirection(
                    (0 == pwm) 
                    ? encode_stopped 
                    : (forward ? encode_forward : encode_reverse));
            }

            // publish power change message
            if(NULL != _messageBus) {
                publish(*_messageBus, WHEEL_POWER, specifier());
            }
        }
    }

    return *this;
}

/**
 * Send pwm and direction to left wheel.
 * Calling this function disabled speed control.
 */
DriveWheel& DriveWheel::setPower(
        bool forward,   // IN : true to move wheel in forward direction
                        //      false to move wheel in reverse direction
        pwm_type pwm)   // IN : target speed for wheel
                        // RET: this drive wheel
{
    if(attached()) {
        this->_useSpeedControl = false;
        this->_setPwm(forward, pwm);
    }
    return *this;
}

/**
 * Set target wheel speed and enable speed control.
 * 
 * The first time this is called, it will enable the
 * speed controller, which will then start
 * maintaining the requested target speed.
 * Calling halt() or setPower() will disable the speed controller.
 * 
 * NOTE: your code should use either 
 *       setPower() or setSpeed() but not both.
 */
DriveWheel& DriveWheel::setSpeed(speed_type speed)
{
    if(attached()) {
        //
        // if we are turning on speed control or
        // if we are changing speed.
        //
        if((!_useSpeedControl) || (speed != _targetSpeed)) {

            //
            // if not already using speed control, 
            // or we are starting from a stop, 
            // or we are chaning direction, then
            // estimate initial pwm so speed control
            // converges faster.
            //
            const speed_type speedPerPwm = (_maxSpeed - _minSpeed) / (speed_type)(255 - _motor->stallPwm());
            const speed_type deltaPwm = (speed - _targetSpeed) / speedPerPwm;
            if((!_useSpeedControl) || (0 == _targetSpeed) || (deltaPwm > 3)) {
                // use feed forward to estimate initial pwm
                if(abs(speed) >= abs(this->_minSpeed)) {
                    // scale within drivable speeds
                    if(this->_maxSpeed > this->_minSpeed) {
                        const pwm_type minPwm = _motor->stallPwm();
                        const pwm_type pwm = (pwm_type)map<speed_type>(abs(speed), _minSpeed, _maxSpeed, minPwm, _motor->maxPwm());
                        this->_setPwm(speed > 0, pwm);
                    }
                }
            }

            this->_targetSpeed = speed;
            this->_useSpeedControl = true;

            // publish target speed change message
            if(NULL != _messageBus) {
                publish(*_messageBus, TARGET_SPEED, specifier());
            }
        }
    }

    return *this;
}



/**
 * Poll drive wheel systems
 */
DriveWheel& DriveWheel::poll(
    unsigned long currentMillis)    // IN : current milliseconds from startup 
                                    // RET: this drive wheel
{
    _pollEncoder();
    _pollSpeed(millis());
    return *this;
}

/**
 * Poll wheel encoders
 */
DriveWheel& DriveWheel::_pollEncoder() // RET: this drive wheel
{
    if(attached()) {
        #ifndef USE_ENCODER_INTERRUPTS
            if((NULL != _encoder) && _encoder->attached()) {
                _encoder->poll();
            }
        #endif
    }

    return *this;
}

/**
 * Poll the closed loop (PID) speed control
 */
DriveWheel& DriveWheel::_pollSpeed(
    unsigned long currentMillis)    // IN : current milliseconds from startup 
                                    // RET: this drive wheel
{
    if(attached() && (NULL != _encoder) && _encoder->attached()) {
        //
        // determine if enough time has gone by to run speed control
        //
        if((0 == lastMs()) || (currentMillis >= (lastMs() + _pollSpeedMillis))) {
            // 
            // move at least CONTROL_MIN_ENCODER_COUNT ticks before we
            // calculate speed; so small tick counts don't create noisy velocity
            //
            encoder_count_type encoderTicks = this->encoderTicks();
            if((encoderTicks - _lastEncoderTicks) >=  CONTROL_MIN_ENCODER_COUNT) {
                encoder_count_type encoderCount = this->encoderCount();
                const distance_type currentDistance = _circumference * (distance_type)encoderCount / _pulsesPerRevolution;
                speed_type currentSpeed = 0; // assume coldstart (no prior reading/history)

                if(_history.count() > 0) {
                    const distance_type deltaDistance = currentDistance - _history.tail().distance;
                    const speed_type deltaSeconds = (currentMillis - _history.tail().millis) / 1000.0;
                    currentSpeed = deltaDistance / deltaSeconds;
                }

                if(_useSpeedControl) {
                    if(0 != _targetSpeed) {
                        pwm_type pwm = _motor->pwm();

                        // const speed_type error = _targetSpeed - currentSpeed;
                        const int speedComparison = compareTo<speed_type>(abs(currentSpeed), abs(_targetSpeed), SPEED_TOLERANCE);

                        // just use a constant controller
                        if((0 != currentSpeed) && (sign(currentSpeed) != sign(_targetSpeed))) {
                            // if we are changing direction, start at zero
                            if(this->forward() != (_targetSpeed > 0)) {
                                pwm = 0;
                            }
                        } else if(speedComparison > 0) {
                            if(pwm > 0) pwm -= 1;   // slow down
                            if(pwm < _motor->stallPwm()) pwm = _motor->stallPwm();   // don't go below stall, so we avoid windup
                        } else if (speedComparison < 0) {
                            if(pwm < _motor->stallPwm()) pwm = _motor->stallPwm();   // jump directly to stall value to avoid windup
                            if(pwm < _motor->maxPwm()) pwm += 1;   // speed up 
                        }

                        _setPwm((_targetSpeed > 0), pwm);
                    } else {
                        //
                        // TODO: setting speed to zero will not immediately stop the wheel due to inertia
                        //       We would like to continue reading the encoder so we get distance while stopping,
                        //       At the same time, a stopped wheel can continually fire the encoder if
                        //       the encoder slot is near and edge, which would inflate distance.
                        //       So we need to eventually handle those two things.
                        //
                        _setPwm(true, 0);    
                    }
                }

                _lastSpeed = currentSpeed;  // last speed used by speed control
                _lastEncoderTicks = encoderTicks;   // last encoder count use by speed control

                // if history is full, drop last entry to make room for new entry
                history_type historyEntry = {currentMillis, currentDistance};
                _history.push(historyEntry);

                // publish speed control message
                if(nullptr != _messageBus) {
                    publish(*_messageBus, SPEED_CONTROL, specifier());
                }
            }
        }
    }

    return *this;
}

