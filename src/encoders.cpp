
#include <Arduino.h>
#include "./encoders.h"

#define LOG_LEVEL DEBUG_LEVEL
#include "./log.h"

//////////////// LM393 wheel encoders ////////////
// Integers for pulse counters
volatile unsigned int leftCount = 0;
volatile unsigned int rightCount = 0;

// Number of slots in encoder disk
const int pulsesPerRevolution = 20;


// Interupt service routine for left wheel encoder
void encodeLeftWheel()  
{
  ++leftCount;  
} 

// Interupt service routine for right wheel encoder
void encodeRightWheel()  
{
  ++rightCount;  
} 

//
// initialize server interupt routines
//
void attachWheelEncoders(int leftInputPin, int rightInputPin) {
    pinMode(leftInputPin, INPUT);
    attachInterrupt(digitalPinToInterrupt(leftInputPin), encodeLeftWheel, RISING); 

    pinMode(rightInputPin, INPUT);
    attachInterrupt(digitalPinToInterrupt(rightInputPin), encodeRightWheel, RISING);
}

void detachWheelEncoders(int leftInputPin, int rightInputPin) {
  detachInterrupt(digitalPinToInterrupt(leftInputPin));
  detachInterrupt(digitalPinToInterrupt(rightInputPin));
}

unsigned int readLeftWheelEncoder() {
    return leftCount;
}

unsigned int readRightWheelEncoder() {
    return rightCount;
}

unsigned int lastLeftCount = 0;
unsigned int lastRightCount = 0;
void logWheelEncoders() {
    #ifdef LOG_MESSAGE
    #ifdef LOG_LEVEL
        #if (LOG_LEVEL >= DEBUG_LEVEL)
            unsigned int thisLeftCount = leftCount;
            if(thisLeftCount != lastLeftCount) {
                LOG_MESSAGE("Left Wheel:  ", thisLeftCount);
                lastLeftCount = thisLeftCount;
            }
            unsigned int thisRightCount = rightCount;
            if(thisRightCount != lastRightCount) {
                LOG_MESSAGE("Right Wheel:  ", thisRightCount);
                lastRightCount = thisRightCount;
            }
        #endif
    #endif
    #endif
}

