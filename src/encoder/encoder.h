#ifndef ENCODER_H
#define ENCODER_H

#include "../gpio/gpio.h"
#include "../gpio/interrupts.h"

typedef int encoder_iss_type;  // encoder interrupt slot 

typedef long encoder_count_type;
typedef enum encoder_direction_type {
    encode_reverse = -1, 
    encode_stopped = 0,
    encode_forward = 1
} encoder_direction_type;

typedef void (*EncoderLogger)(const char *, int);

class Encoder {

    private:
    const gpio_type _pin;
    const encoder_iss_type _interrupt_slot;

    // encoder state
    volatile encoder_count_type _count = 0;
    encoder_direction_type _direction = encode_stopped;
    boolean _attached = false;
    gpio_state _pinState = GPIO_HIGH;

    public:

    Encoder(gpio_type inputPin, encoder_iss_type interrupt_slot)
        : _pin(inputPin), _interrupt_slot(interrupt_slot)
    {
        // no-op
    }

    /**
     * Get gpio input pin, passed to constructor
     */
    gpio_type pin(); // RET: gpio input pin for encoder

    /**
     * Read the pin state
     */
    gpio_state readPin(); // RET: pin state GPIO_LOW or GPIO_HIGH

    /**
     * Get the current encoder count.
     */
    encoder_count_type count(); // RET: current encoder count

    /**
     * Set the direction in which the encoder will increment.
     * Optical encoders cannot encode direction natively,
     * but the motor control logic knows, so it can tell
     * the encoder using this method.
     * A quadrature encoder can encode direction, so 
     * it would call setDirection() prior to calling encode()
     */
    void setDirection(
        encoder_direction_type direction);   // IN : encoder_forward, encoder_stopped, encoder_reverse

    /**
     * Get the current encoder direction
     */
    encoder_direction_type direction();    // RET: encoder_forward, encoder_stopped, encoder_reverse

    /**
     * Increment the encoder based on the direction.
     * When using an interrupt service routine, it
     * should call this method.
     */
    void FASTCODE encode();

    /**
     * Set the pin mode and enable polling
     */
    void attach();

    /**
     * Disable polling
     */
    void detach();

    /**
     * Determine if encoder is attached to pin
     */
    bool attached();

    /**
     * Poll the gpio pin to watch for RISING transition.
     * 
     * NOTE: This method exists for the case where an external
     *       interrupt service routine cannot be used to watch
     *       the input pin.  In that case, polling is the only option.
     * 
     * NOTE: You must call attach() before you start calling poll().
     *       You must call poll at least twice as fast an you believe
     *       transitions will happen in order to get an accurate count.
     *       For instance, if it is an optical wheel encoder with 10 slots,
     *       then there will be 10 RISING transitions and 10 FALLING
     *       transitions with each rotation of the encoder/wheel.
     *       If the wheels maximum RPM is expected to be 100 RPM, then
     *       minimum poll() = (100 / 60) * 20 * 2 ~= 67 per second.
     */      
    void poll();
};

#endif // ENCODER_H
