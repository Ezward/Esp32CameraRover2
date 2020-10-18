#include <Arduino.h>
#include "drive_wheel.h"
#include "../pid/pid.h"
#include "../util/math.h"

/**
 * Get the motor stall value
 */
pwm_type DriveWheel::stallPwm() // RET: the pwm at or below which the motor will stall
{
    return this->_stall_pwm;
}

/**
 * Set the measured motor stall value
 */
DriveWheel& DriveWheel::setStallPwm(pwm_type pwm)  // IN : pwm at which motor will stall
                                        // RET: this motor
{
    this->_stall_pwm = pwm;

    return *this;
}


/**
 * Get the circumference of the wheel
 */
bool DriveWheel::circumference()   // RET: circumference passed to constructor
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
    SpeedController *controller,// IN : point to pid controller
                                //      or NULL if not pid controller used
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
            _controller = controller;
        }

        if(NULL != (_messageBus = messageBus)) {
            publish(*_messageBus, ATTACHED, specifier());
        }
    }

    return *this;
}

/**
 * Detach drive wheel dependencies
 */
DriveWheel& DriveWheel::detach() // RET: this drive wheel in detached state
{
    if(attached()) {
        _motor = NULL;

        if(NULL != _encoder) {
            // detach encoder from it's input pin
            _encoder->detach();
            _encoder = NULL;
            _controller = NULL;
        }

        if(NULL != _messageBus) {
            publish(*_messageBus, DETACHED, specifier());
            _messageBus = NULL;
        }
    }

    return *this;
}

/**
 * Read value of left wheel encoder
 */
encoder_count_type DriveWheel::readEncoder() // RET: wheel encoder count
{
    return (attached() && (NULL != _encoder)) ? _encoder->count() : 0;
}


/**
 * Immediately stop the rover and disengage speed control
 * if it is engaged (if setSpeed() has been called)
 */
DriveWheel& DriveWheel::halt() // RET: this drive wheel
{
    // disengage speed control
    this->_targetSpeed = 0;
    this->_lastMillis = 0;
    this->_useSpeedControl = false;

    // stop the wheel
    setPower(true, 0);

    // publish halt message
    if(NULL != _messageBus) {
        publish(*_messageBus, HALT, specifier());
    }


    return *this;
}


/**
 * Send speed and direction to left wheel.
 * 
 * NOTE: your code should use either 
 *       setPower() or setSpeed() but not both.
 */
DriveWheel& DriveWheel::setPower(
        bool forward,   // IN : true to move wheel in forward direction
                        //      false to move wheel in reverse direction
        pwm_type pwm)   // IN : target speed for wheel
                        // RET: this drive wheel
{
    if (attached()) {
        // set pwm
        if((_motor->forward() != forward) || (_motor->pwm() != pwm)) {
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
 * Set target wheel speed.
 * 
 * The first time this is called, it will enable the
 * speed controller, which will then start
 * maintaining the requested target speed.
 * Calling halt() will disable the speed controller.
 * 
 * NOTE: your code should use either 
 *       setPower() or setSpeed() but not both.
 */
DriveWheel& DriveWheel::setSpeed(speed_type speed)
{
    this->_targetSpeed = speed;
    this->_lastMillis = millis();
    this->_useSpeedControl = true;

    // publish target speed change message
    if(NULL != _messageBus) {
        publish(*_messageBus, TARGET_SPEED, specifier());
    }

    return *this;
}



/**
 * Poll drive wheel systems
 */
DriveWheel& DriveWheel::poll() // RET: this drive wheel
{
    _pollEncoder();
    _pollSpeed();
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
DriveWheel& DriveWheel::_pollSpeed() // RET: this drive wheel
{
    if(attached() && (NULL != _encoder) && _encoder->attached()) {
        //
        // if _lastMillis is zero, then setSpeed() has never been
        // called, so do not engage the speed controller.
        //
        const unsigned long currentMillis = millis();
        const unsigned long deltaMillis = currentMillis - _lastMillis;
        const float deltaSeconds = deltaMillis / 1000.0;
        if(deltaMillis >= _pollSpeedMillis) {
            const encoder_count_type currentCount = readEncoder();
            const float currentDistance = _circumference * (float)currentCount / _pulsesPerRevolution;
            const float currentSpeed = (currentDistance - _lastDistance) / deltaSeconds;

            if(_useSpeedControl) {
                if(0 != _targetSpeed) {
                    pwm_type pwm = _motor->pwm();
                    if(NULL != _controller) {
                        pwm = _controller->update(currentSpeed, currentMillis);
                    } else {
                        // just use a constant controller
                        if(abs(currentSpeed) > abs(_targetSpeed)) {
                            pwm -= 3;   // slow down
                        } else if (abs(currentSpeed) < abs(_targetSpeed)) {
                            pwm += 3;   // speed up 
                        }
                    }

                    pwm = bound<pwm_type>(pwm, 0, _motor->maxPwm());
                    setPower((_targetSpeed >= 0), pwm);
                
                } else {
                    //
                    // TODO: setting speed to zero will not immediately stop the wheel due to inertia
                    //       We would like to continue reading the encoder so we get distance while stopping,
                    //       At the same time, a stopped wheel can continually fire the encoder if
                    //       the encoder slot is near and edge, which would inflate distance.
                    //       So we need to eventually handle those two things.
                    //
                    setPower(true, 0);    
                }
            }

            // update state
            _lastDistance = currentDistance;
            _lastSpeed = currentSpeed;
            _lastMillis = currentMillis;

            // publish speed control message
            if(NULL != _messageBus) {
                publish(*_messageBus, SPEED_CONTROL, specifier());
            }
        }
    }

    return *this;
}

