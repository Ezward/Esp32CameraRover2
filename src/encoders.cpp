
#include <Arduino.h>
#include "./encoders.h"

#define LOG_LEVEL DEBUG_LEVEL
#include "./log.h"

#include "gpio/pwm.h"
#include "gpio/interrupts.h"


//////////////// LM393 wheel encoders ////////////
Encoder *_leftWheelEncoder = NULL;
Encoder *_rightWheelEncoder = NULL;

// Number of slots in encoder disk
unsigned int ppr = 20;
unsigned int pulsesPerRevolution() {
    return ppr;
}

// Interupt service routines for wheel encoders
#if defined(ESP32)
    void FASTCODE encodeLeftWheel(void *params)  
    {
        if(NULL != _leftWheelEncoder) {
            _leftWheelEncoder->encode();
        }
    } 

    void FASTCODE encodeRightWheel(void *params)  
    {
        if(NULL != _rightWheelEncoder) {
            _rightWheelEncoder->encode();
        }
    } 
#else
    void encodeLeftWheel()  
    {
        if(NULL != _leftWheelEncoder) {
            _leftWheelEncoder->encode();
        }
    } 

    void encodeRightWheel()  
    {
        if(NULL != _rightWheelEncoder) {
            _rightWheelEncoder->encode();
        }
    } 
#endif

bool encoderInterruptsAttached() {
    return NULL != _leftWheelEncoder;
}

//
// initialize server interupt routines
//
void attachEncoderInterrupts(Encoder &leftWheelEncoder, Encoder &rightWheelEncoder, encoder_count_type pulsesPerRevolution) {
    if(!encoderInterruptsAttached()) {
        ppr = pulsesPerRevolution;

        _leftWheelEncoder = &leftWheelEncoder;
        _rightWheelEncoder = &rightWheelEncoder;

        _leftWheelEncoder->attach();
        _rightWheelEncoder->attach();

        ATTACH_ISR(encodeLeftWheel, _leftWheelEncoder->pin(), FALLING_EDGE);
        ATTACH_ISR(encodeRightWheel, _rightWheelEncoder->pin(), FALLING_EDGE);
    }
}


void detachEncoderInterrupts(int leftInputPin, int rightInputPin) {
    if(encoderInterruptsAttached()) {
        DETACH_ISR(encodeLeftWheel, _leftWheelEncoder->pin());
        DETACH_ISR(encodeRightWheel, _rightWheelEncoder->pin());

        _leftWheelEncoder->detach();
        _rightWheelEncoder->detach();

        _leftWheelEncoder = NULL;
        _rightWheelEncoder = NULL;
    }
}


