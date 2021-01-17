// #include <Arduino.h>
#include "encoder.h"

#define LOG_LEVEL DEBUG_LEVEL
#include "./log.h"

// defined in encoderInterrupts.cpp
extern bool encoderInterruptAttached(encoder_iss_type interruptServiceSlot);
extern bool attachEncoderInterrupt(Encoder &encoder, encoder_iss_type interruptServiceSlot);
extern bool detachEncoderInterrupt(Encoder &encoder, encoder_iss_type interruptServiceSlot);


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
    ++this->_readingCount;  // set semaphore
    const encoder_count_type c = this->_count;    // read the value
    --this->_readingCount;  // reset semaphone
    return c;               // return the value
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
    //
    // This method is called by an external
    // interrupt service routine, so it is
    // possible for it to interrupt reading
    // of the 4 byte count.  To avoid reading
    // a partially committed value, we keep a 
    // second, buffered count which we can increment
    // at will.  We add this to the readable
    // count only if it is not currently being read.
    // This avoids turning off/on interrupts during
    // the read, which is expensive.  
    //
    this->_bufferedCount += (encoder_count_type)_direction;
    if(!this->_readingCount) {                  // if semaphore is not set
        this->_count += this->_bufferedCount;   // write the value
        this->_bufferedCount = 0;               // clear the buffered value
    }
} 

/**
 * Determine if encoder is attached to pin
 */
bool Encoder::attached()     // RET: true if attached, false if not
{
    return this->_attached;
}


/**
 * Set the pin mode and enable polling
 */
void Encoder::attach() {
    pinMode(_pin, INPUT_PULLUP);
    if(this->_interrupt_slot >= 0) {
        attachEncoderInterrupt(*this, this->_interrupt_slot);
    }
    _attached = true;
}

/**
 * Disable polling
 */
void Encoder::detach() {
    if(this->_interrupt_slot >= 0) {
        detachEncoderInterrupt(*this, this->_interrupt_slot);
    }
    _attached = false;
}

/**
 * Read the pin state
 */
gpio_state Encoder::readPin() // RET: pin state GPIO_LOW or GPIO_HIGH
{
    if(attached()) {
        return (gpio_state)digitalRead(_pin);
    }
    return GPIO_LOW;
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
    if(_attached) {
        //
        // only do this if not using interrupts
        //
        if(this->_interrupt_slot < 0) {
            // we encode on any transition edge
            gpio_state newState = readPin();
            if(newState != _pinState) {
                _pinState = newState;
                encode();
            }
        }
    }
}


