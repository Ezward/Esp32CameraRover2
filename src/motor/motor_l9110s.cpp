#include "motor_l9110s.h"

/**
 * Get bit resolution of motor driver.
 * The PwmChannels must use this value.
 */
pwm_resolution_type MotorL9110s::pwmBits()    // RET: bit resolution of pwn signal
{
    return 8;
}

/**
 * Get motor's current direction
 */
bool MotorL9110s::forward()  // RET: true if current pwm value is a forward value
{
    return this->_forward;
}

/**
 * Get motor's current pwm value 
 */
pwm_type MotorL9110s::pwm()  // RET: current pwm value (0 to (1 << pwmBits()) - 1)
{
    return this->_pwm;
}

/**
 * Determine if dependencies (like pwm channel) are attached.
 */
bool MotorL9110s::attached()    // RET: true if dependencies attached 
{
    return (NULL != _forwardPin);
}

/**
 * Attach the motor 
 * - set the output pins to pwm write mode
 */
MotorL9110s& MotorL9110s::attach(
        PwmChannel &forwardPin, // IN : pin for forward PWM input
                                //      MUST exist until detach is called 
        PwmChannel &reversePin) // IN : pin for reverse PWM input
                                //      MUST exist until detach is called 
{
    if(!_attached) {
        assert (forwardPin.pwmBits() == MotorL9110s::pwmBits());
        assert (reversePin.pwmBits() == MotorL9110s::pwmBits());

        _forwardPin = &forwardPin;
        _reversePin = &reversePin;

        // set pin mode and analog write channel
        _forwardPin->attach();
        _reversePin->attach();
        _attached = true;
        setPower(false, 0); // stop the motor
    }
    return *this;
}

/**
 * Detach the motor
 * - stop the motor
 * - if possible, revert output pins to default state
 */
MotorL9110s& MotorL9110s::detach()
{
    if(_attached) {
        setPower(false, 0); // stop the motor
        _forwardPin->detach();
        _reversePin->detach();
        _attached = false;
    }

    return *this;
}

/**
 * Set the power (pwm duty cycle) for the motor
 */
void MotorL9110s::setPower(
    bool forward,   // IN : true for forward PWM, 
                    //      false for reverse PWM
    pwm_type pwm)   // IN : pwm value; zero is stopped
                    //      ((1 << pwmBits()) - 1) is full power
{
    if(_attached) {        
        if(true == (this->_forward = forward)) {
            _forwardPin->writePwm(this->_pwm = pwm);
            _reversePin->writePwm(0);
        }
        else {
            _forwardPin->writePwm(0);
            _reversePin->writePwm(this->_pwm = pwm);
        }
    }
}
