
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

bool wheelEncodersAttached() {
    return NULL != _leftWheelEncoder;
}

//
// initialize server interupt routines
//
void attachWheelEncoders(Encoder &leftWheelEncoder, Encoder &rightWheelEncoder, encoder_count_type pulsesPerRevolution) {
    if(!wheelEncodersAttached()) {
        ppr = pulsesPerRevolution;

        _leftWheelEncoder = &leftWheelEncoder;
        _rightWheelEncoder = &rightWheelEncoder;

        _leftWheelEncoder->attach();
        _rightWheelEncoder->attach();

        ATTACH_ISR(encodeLeftWheel, _leftWheelEncoder->pin(), FALLING_EDGE);
        ATTACH_ISR(encodeRightWheel, _rightWheelEncoder->pin(), FALLING_EDGE);
    }
}


void detachWheelEncoders(int leftInputPin, int rightInputPin) {
    if(wheelEncodersAttached()) {
        DETACH_ISR(encodeLeftWheel, _leftWheelEncoder->pin());
        DETACH_ISR(encodeRightWheel, _rightWheelEncoder->pin());

        _leftWheelEncoder->detach();
        _rightWheelEncoder->detach();

        _leftWheelEncoder = NULL;
        _rightWheelEncoder = NULL;
    }
}

int readLeftWheelEncoder() {
    return (NULL != _leftWheelEncoder) ? _leftWheelEncoder->count() : 0;
}

int readRightWheelEncoder() {
    return (NULL != _rightWheelEncoder) ? _rightWheelEncoder->count() : 0;
}

/**
 * Tell encoder if it should increment, decrement or freeze
 */
void setLeftEncoderDirection(encoder_direction_type direction) {
    if(NULL != _leftWheelEncoder) {
        _leftWheelEncoder->setDirection(direction);
    }
}

/**
 * Tell encoder if it should increment, decrement or freeze
 */
void setRightEncoderDirection(encoder_direction_type direction) {
    if(NULL != _rightWheelEncoder) {
        _rightWheelEncoder->setDirection(direction);
    }
}

unsigned int _lastLeftCount = 0;
unsigned int _lastRightCount = 0;
void logWheelEncoders(EncoderLogger logger) {
    #ifdef LOG_MESSAGE
    #ifdef LOG_LEVEL
        #if (LOG_LEVEL >= DEBUG_LEVEL)
            unsigned int thisLeftCount = readLeftWheelEncoder();
            if(thisLeftCount != _lastLeftCount) {
                logger("Left Wheel:  ", thisLeftCount);
                _lastLeftCount = thisLeftCount;
            }
            unsigned int thisRightCount = readRightWheelEncoder();
            if(thisRightCount != _lastRightCount) {
                logger("Right Wheel:  ", thisRightCount);
                _lastRightCount = thisRightCount;
            }
        #endif
    #endif
    #endif
}

