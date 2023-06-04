/**
 * Provide for some number of encoder interrupt service routines
 */
// #include <Arduino.h>
#include <assert.h>
#include "encoder.h"


#define LOG_LEVEL DEBUG_LEVEL
#include "../../log.h"

#include "../../gpio/pwm.h"
#include "../../gpio/interrupts.h"


//////////////// LM393 wheel encoders ////////////
#define ENCODER_COUNT 2
Encoder *_encoder[ENCODER_COUNT] = {NULL, NULL};


//
// Interrupt service routines
// There MUST be ENCODER_COUNT number of routines
void FASTCODE encode_0(ISR_PARAMS)  
{
    Encoder *encoder = _encoder[0];
    if(NULL != encoder) {
        encoder->encode();
    }
} 

void FASTCODE encode_1(ISR_PARAMS)  
{
    Encoder *encoder = _encoder[1];
    if(NULL != encoder) {
        encoder->encode();
    }
} 

gpio_isr_type _isr_routines[ENCODER_COUNT] = {
    encode_0,
    encode_1
};

/**
 * Determine if an interrupt service routine is attached 
 * at the given interrupt service slot.
 */
bool encoderInterruptAttached(encoder_iss_type interruptServiceSlot) {
    assert((interruptServiceSlot >= 0) && (interruptServiceSlot < ENCODER_COUNT));

    return NULL != _encoder[interruptServiceSlot];
}

/**
 * Attach an encoder to an interrupt service routine
 * in the requested slot.
 */
bool attachEncoderInterrupt(
    Encoder &encoder,                       // IN : encoder to be attached
    encoder_iss_type interruptServiceSlot)  // IN : encoder interrupt slot 0 to ENCODER_COUNT - 1
                                            // RET: true if interrupt attached, 
                                            //      false if not, which may be because
                                            //      - slot is occupied by a different encoder.
{
    if(!encoderInterruptAttached(interruptServiceSlot)) {
        _encoder[interruptServiceSlot] = &encoder;

        ATTACH_ISR(_isr_routines[interruptServiceSlot], encoder.pin(), CHANGING_EDGE);
    }
    return &encoder == _encoder[interruptServiceSlot];
}

/**
 * Detach an encoder from an an interrupt service routine
 * at the requested slot.
 */
bool detachEncoderInterrupt(
    Encoder &encoder,                       // IN : encoder to detach 
    encoder_iss_type interruptServiceSlot)  // IN : encoder interrupt slot, 0 to ENCODER_COUNT - 1
                                            // RET: true if interrupt was detached from slot,
                                            //      false if not, which may be because 
                                            //      - slot is occupied by a different encoder.
{
    if(encoderInterruptAttached(interruptServiceSlot)) {
        Encoder *theEncoder = _encoder[interruptServiceSlot];
        if(theEncoder == &encoder) {
            DETACH_ISR(_isr_routines[interruptServiceSlot], encoder.pin());

            _encoder[interruptServiceSlot] = NULL;
        }
    }
    return !encoderInterruptAttached(interruptServiceSlot);
}


