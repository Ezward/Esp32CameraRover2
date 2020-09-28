#ifndef GPIO_PWM_H
#define GPIO_PWM_H

#include "gpio.h"
#include "analogWrite.h"

typedef unsigned char pwm_resolution_type;  // pwm resolution
typedef unsigned int pwm_type;              // pwm value
typedef int analog_write_channel_type;      // analog write channel number

/**
 * A gpio pin and analog write channel
 * used to write pwm values to the pin.
 */
class PwmChannel {
    private:
    gpio_type _pin;
    analog_write_channel_type _channel;
    pwm_resolution_type _pwmBits;
    pwm_type _pwmMask;

    // current state
    bool _attached = false;
    pwm_type _pwm = 0;

    public:

    PwmChannel(
        gpio_type pin, 
        analog_write_channel_type channel,
        unsigned char pwmBits)
        : _pin(pin), _channel(channel), _pwmBits(pwmBits)
    {
        this->_pwmMask = (1 << ((unsigned int)pwmBits)) - 1;
    }

    ~PwmChannel() {
        detach();
    }

    /**
     * Get gpio pin passed to constructor
     */
    gpio_type pin(); // RET: gpio pin for pwm output

    /**
     * Get analog write channel passed to constructor
     */
    analog_write_channel_type channel(); // RET: analog write channel

    /**
     * Get number of bits in pwm value, passed to constructor.
     */
    pwm_resolution_type pwmBits();   // RET: number of bits in pwm value

    /**
     * Get the pwm bit mask
     */
    pwm_type pwmMask();  // RET: (1 << ((unsigned int)pwmBits)) - 1;

    /**
     * Get last written pwm value
     */
    pwm_type pwm();  // RET: 0..pwmMask()

    /**
     * Set pin mode and analog write channels
     */
    PwmChannel& attach();    // RET: this attached channel

    /**
     * Detach the motor
     * - stop the motor
     * - if possible, revert output pins to default state
     */
    PwmChannel& detach();    // RET: this detached channel

    /**
     * Write pwm value to output pin/channel
     */
    PwmChannel& writePwm(pwm_type pwm);  // IN : pwm value (0 to pwmMask)
                                        // RET: this channel
};

#endif // GPIO_PWM_H
