#include <Arduino.h>
#include "drive_wheel.h"

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
    int pulsesPerRevolution)    // IN : encoder pulses in one wheel turn
                                // RET: this wheel in attached state
{
    if(!attached()) {
        // motors should already be in attached state
        _motor = &motor;

        if(NULL != (_encoder = encoder)) {
            // attach encoder to it's input pin
            _encoder->attach();
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
 * Poll rover systems
 */
DriveWheel& DriveWheel::poll() // RET: this rover
{
    return _pollEncoder();
}

/**
 * Poll wheel encoders
 */
DriveWheel& DriveWheel::_pollEncoder() // RET: this rover
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

