#include "pwm.h"

/**
 * Get gpio pin passed to constructor
 */
gpio_type PwmChannel::pin() // RET: gpio pin for pwm output
{
    return this->_pin;
}

/**
 * Get analog write channel passed to constructor
 */
analog_write_channel_type PwmChannel::channel() // RET: analog write channel
{
    return this->_channel;
}

/**
 * Get number of bits in pwm value, passed to constructor.
 */
pwm_resolution_type PwmChannel::pwmBits()   // RET: number of bits in pwm value
{
    return _pwmBits;
}

/**
 * Get the pwm bit mask
 */
pwm_type PwmChannel::pwmMask()  // RET: (1 << ((unsigned int)pwmBits)) - 1;
{
    return this->_pwmMask;
}

/**
 * Get last written pwm value
 */
pwm_type PwmChannel::pwm()  // RET: 0..pwmMask()
{
    return this->_pwm;
}


/**
 * Set pin mode and analog write channels
 */
PwmChannel& PwmChannel::attach()    // RET: this attached channel
{
    if(!_attached) {
        // set pin mode and analog write channel
        pinMode(_pin, OUTPUT); 
        _attached = true;
    }

    return *this;
}

/**
 * Detach the motor
 * - stop the motor
 * - if possible, revert output pins to default state
 */
PwmChannel& PwmChannel::detach()    // RET: this detached channel
{
    if(_attached) {
        writePwm(0);    // reset pwm to zero
        // TODO: if there is a way to set pinMode and channel to defaults, to that here
        _attached = false;
    }

    return *this;
}

/**
 * Write pwm value to output pin/channel
 */
PwmChannel& PwmChannel::writePwm(pwm_type pwm)  // IN : pwm value (0 to pwmMask)
                                                // RET: this channel
{
    if(_attached) {
        analogWrite(_pin, pwm);
    }

    return *this;
}
