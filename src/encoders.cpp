
#include <Arduino.h>
#include "./encoders.h"

#define LOG_LEVEL DEBUG_LEVEL
#include "./log.h"

#if defined(ESP32)
 #define FASTCODE IRAM_ATTR
 #define FASTDATA DRAM_ATTR
    int attachEsp32CamInterrupt(gpio_num_t gpioPin, gpio_isr_t handler, gpio_int_type_t mode) {
        int err = gpio_isr_handler_add(gpioPin, handler, (void *) 1);
        if (err != ESP_OK) {
            SERIAL_PRINT("Handler add failed with error: "); SERIAL_PRINTLN(err);
            return ESP_FAIL;
        }
        err = gpio_set_intr_type(gpioPin, mode);
        if (err != ESP_OK) {
            SERIAL_PRINT("set intr type failed with error: "); SERIAL_PRINTLN(err);
            return ESP_FAIL;
        }
        return ESP_OK;
    }
#else
 #define FASTCODE 
 #define FASTDATA 
#endif


//////////////// LM393 wheel encoders ////////////
// Integers for pulse counters
volatile unsigned int leftCount = 0;
volatile unsigned int rightCount = 0;

// Number of slots in encoder disk
unsigned int ppr = 20;
unsigned int pulsesPerRevolution() {
    return ppr;
}

// Interupt service routines for wheel encoders
#if defined(ESP32)
    void FASTCODE encodeLeftWheel(void *params)  
    {
        leftCount += 1;  
    } 

    void FASTCODE encodeRightWheel(void *params)  
    {
        rightCount += 1;  
    } 
#else
    void encodeLeftWheel()  
    {
        leftCount += 1;  
    } 

    void encodeRightWheel()  
    {
        rightCount += 1;  
    } 
#endif



//
// initialize server interupt routines
//
void attachWheelEncoders(unsigned int pulsesPerRevolution, int leftInputPin, int rightInputPin) {
    ppr = pulsesPerRevolution;

    pinMode(leftInputPin, INPUT_PULLUP);
    pinMode(rightInputPin, INPUT_PULLUP);

    #if defined(ESP32)
        attachEsp32CamInterrupt((gpio_num_t)leftInputPin, encodeLeftWheel, GPIO_INTR_NEGEDGE); 
        attachEsp32CamInterrupt((gpio_num_t)rightInputPin, encodeRightWheel, GPIO_INTR_NEGEDGE);
    #else
        attachInterrupt(digitalPinToInterrupt(leftInputPin), encodeLeftWheel, RISING); 
        attachInterrupt(digitalPinToInterrupt(rightInputPin), encodeRightWheel, RISING);
    #endif

}

void detachWheelEncoders(int leftInputPin, int rightInputPin) {
    #if defined(ESP32)
        detachInterrupt(digitalPinToInterrupt(leftInputPin));
        detachInterrupt(digitalPinToInterrupt(rightInputPin));
    #else
        detachInterrupt(digitalPinToInterrupt(leftInputPin));
        detachInterrupt(digitalPinToInterrupt(rightInputPin));
    #endif
}

unsigned int readLeftWheelEncoder() {
    return leftCount;
}

unsigned int readRightWheelEncoder() {
    return rightCount;
}

unsigned int lastLeftCount = 0;
unsigned int lastRightCount = 0;
void logWheelEncoders(EncoderLogger logger) {
    #ifdef LOG_MESSAGE
    #ifdef LOG_LEVEL
        #if (LOG_LEVEL >= DEBUG_LEVEL)
            unsigned int thisLeftCount = leftCount;
            if(thisLeftCount != lastLeftCount) {
                logger("Left Wheel:  ", thisLeftCount);
                lastLeftCount = thisLeftCount;
            }
            unsigned int thisRightCount = rightCount;
            if(thisRightCount != lastRightCount) {
                logger("Right Wheel:  ", thisRightCount);
                lastRightCount = thisRightCount;
            }
        #endif
    #endif
    #endif
}

