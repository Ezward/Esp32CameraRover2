#ifndef ENCODER_H
#define ENCODER_H

#include "../../gpio/gpio.h"
#include "../../gpio/interrupts.h"
#include "../../config.h"

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
    volatile unsigned char _readingCount = 0;   // semaphore must be 'atomic' so use a byte
    volatile int _bufferedCount = 0;            // do NOT read this value, it is incremented in ISR
    volatile encoder_count_type _count = 0;     // the readable encoder count; signed value that 
                                                // may increment or decrement based on _direction
    volatile int _bufferedTicks = 0;            // do NOT read this value, it is incremented in ISR
    volatile encoder_count_type _ticks = 0;     // the readable encoder ticks; an unsigned value
                                                // that increments without regard for direction.

    volatile unsigned char _settingDirection = 0;   // semaphore to indicate to ISR when outer code
                                                    // is setting direction values
    volatile encoder_direction_type _direction = encode_stopped;

    //
    // handle 'settling'; the time from transitioning from a non-zero pwm to a zero pwm whern
    // the rover will slow to a stop; we want to continue to integrate ticks in the last
    // directions for a short period in order to capture the true pose of the rover.
    //
    const unsigned int _settleMs = CONTROL_SETTLE_MS;   // milliseconds encoder will continue to integrate
                                                        // the prior direction even if zero; handles inertia
    volatile unsigned long _settleTimeMs = 0;             // time until which we will integrate encoder event if direction is zero
    volatile encoder_direction_type _settleDirection = encode_stopped;   // direction when pwm transitioned from non-zero to zero

    bool _attached = false;

    #ifndef USE_ENCODER_INTERRUPTS
        gpio_state _pinState = GPIO_LOW;
        uint8_t _readings = 0;              // history of last 8 readings
        uint8_t _transition = 0;            // value of last 8 readings for next stable state transition 
        unsigned long _pollAtMicros = 0UL;  // time of next poll
    #endif

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
     * Get the current encoder ticks.
     * This is an unsigned value that always increases,
     * counting ticks independent of wheel direction.
     */
    encoder_count_type ticks(); // RET: current encoder ticks

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
     * Set the number of milliseconds the encoder will
     * continue to integrate ticks even when direction 
     * is zero.  This should be called on every transition
     * from a non-zero pwm to a zero pwm.  It should NOT
     * be called when resetting zero to zero pwm.
     * 
     * This is to handle the inertial 'slow-to-stop'
     * real-world physics of the rover.  If we don't
     * integrate after setting a zero velocity, then
     * the ticks that happens during slowdown will
     * be ignored and the robot's pose will be incorrectly
     * calculated.
     */
    void settle(unsigned int settleMs); // IN : milliseconds encoder will continue to integrate

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
