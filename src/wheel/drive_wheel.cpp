#include <Arduino.h>
#include "drive_wheel.h"
#include "../pid/pid.h"

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
    SpeedController *controller)// IN : point to pid controller
                                //      or NULL if not pid controller used
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
 * immediately stop the rover and clear command queue
 */
DriveWheel& DriveWheel::halt() // RET: this drive wheel
{
    // stop the wheel
    return setPower(true, 0);
}


/**
 * send speed and direction to left wheel
 */
DriveWheel& DriveWheel::setPower(
        bool forward,   // IN : true to move wheel in forward direction
                        //      false to move wheel in reverse direction
        pwm_type pwm)   // IN : target speed for wheel
                        // RET: this drive wheel
{
    if (attached()) {
        // set pwm
        _motor->setPower(forward, pwm);

        // set encoder direction to match
        if(NULL != _encoder) {
            _encoder->setDirection(
                (0 == pwm) 
                ? encode_stopped 
                : (forward ? encode_forward : encode_reverse));
        }
    }

    return *this;
}

/**
 * Set target wheel speed
 */
DriveWheel& DriveWheel::setSpeed(speed_type speed)
{
    this->_targetSpeed = speed;
    this->_lastMillis = millis();   // restart

    return *this;
}



/**
 * Poll drive wheel systems
 */
DriveWheel& DriveWheel::poll() // RET: this drive wheel
{
    return _pollEncoder();
}

/**
 * Poll wheel encoders
 */
DriveWheel& DriveWheel::_pollEncoder() // RET: this drive wheel
{
    if(attached()) {
        #ifndef USE_ENCODER_INTERRUPTS
            if(NULL != _encoder) {
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
    if(attached()) {
        if(_targetSpeed != 0) {
            //
            // TODO: controllers must handle direction flag
            //
            const unsigned long currentMillis = millis();
            const unsigned long deltaMillis = currentMillis - _lastMillis;
            const float deltaSeconds = 1000 * deltaMillis;
            if(deltaMillis >= _pollSpeedMillis) {
                const encoder_count_type currentCount = readEncoder();
                const float currentDistance = _circumference * (float)currentCount / _pulsesPerRevolution;
                const float currentSpeed = (currentDistance - _lastDistance) / deltaSeconds;

                pwm_type pwm = _motor->pwm();
                if(NULL != _controller) {
                    pwm = _controller->update(currentSpeed, currentMillis);
                } else {
                    // TODO: create a more robust constant controller
                    // just use a constant controller
                    if(currentSpeed > _targetSpeed) {
                        pwm -= 3;   // slow down
                    } else if (currentSpeed < _targetSpeed) {
                        pwm += 3;   // speed up 
                    }
                    pwm = constrain(pwm, 0, _motor->maxPwm());
                }

                _motor->setPower((_targetSpeed >= 0), pwm);

                // update state
                _lastDistance = currentDistance;
                _lastSpeed = currentSpeed;
                _lastMillis = currentMillis;
            }
        } else {
            //
            // TODO: setting speed to zero will not immediately stop the wheel due to inertia
            //       We would like to continue reading the encoder so we get distance while stopping,
            //       At the same time, a stopped wheel can continually fire the encoder if
            //       the encoder slot is near and edge, which would inflate distance.
            //       So we need to eventually handle those two things.
            //
            setPower(true, 0);    
            _lastMillis = millis();
        }
    }

    return *this;
}

