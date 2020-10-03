#include <Arduino.h>
#include "encoder.h"

#define LOG_LEVEL DEBUG_LEVEL
#include "./log.h"

/**
 * Get gpio input pin, passed to constructor
 */
gpio_type Encoder::pin() // RET: gpio input pin for encoder
{
    return this->_pin;
}


/**
 * Get the current encoder count.
 */
encoder_count_type Encoder::count() // RET: current encoder count
{
    return this->_count;
}

/**
 * Set the direction in which the encoder will increment.
 * Optical encoders cannot encode direction natively,
 * but the motor control logic knows, so it can tell
 * the encoder using this method.
 * A quadrature encoder can encode direction, so 
 * it would call setDirection() prior to calling encode()
 */
void Encoder::setDirection(
    encoder_direction_type direction)   // IN : encoder_forward, encoder_stopped, encoder_reverse
{
    this->_direction = direction;
}

/**
 * Get the current encoder direction
 */
encoder_direction_type Encoder::direction()    // RET: encoder_forward, encoder_stopped, encoder_reverse
{
    return this->_direction;
}

/**
 * Increment the encoder based on the direction.
 * When using an interrupt service routine, it
 * should call this method.
 */
void FASTCODE Encoder::encode()  
{
    this->_count += (encoder_count_type)_direction;  
} 

/**
 * Set the pin mode and enable polling
 */
void Encoder::attach() {
    pinMode(_pin, INPUT_PULLUP);
    _attached = true;
}

/**
 * Disable polling
 */
void Encoder::detach() {
    _attached = false;
}

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
void Encoder::poll() {
    #ifndef USE_ENCODER_INTERRUPTS
        if(_attached) {
            // we encode on transition from HIGH to LOW (FALLING) edge
            gpio_state newState = (gpio_state)digitalRead(_pin);
            if(newState != _pinState) {
                if(GPIO_LOW == (_pinState = newState)) {
                    encode();
                }
            }
        }
    #endif
}


