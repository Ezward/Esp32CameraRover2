#ifndef Arduino_h
    #include <Arduino.h>
#endif

#include "interrupts.h"

#define LOG_LEVEL DEBUG_LEVEL
#include "./log.h"


#if defined(ESP32)
    //
    // The Esp32Cam initializes the interrupt system, as done the arduino 'attachInterrupt()' method.
    // That conflict causes a failure.  So we need to 
    // 1. Initialize camera BEFORE the encoder interupts are added
    // 2. Use Esp32 specific code to attach the interrupt routine to avoid a second initialization
    //
    int attachEsp32Interrupt(gpio_num_t gpioPin, gpio_isr_t handler, gpio_int_type_t mode) {
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

    int detachEsp32Interrupt(gpio_num_t gpioPin) {
        int err = gpio_set_intr_type(gpioPin, GPIO_INTR_DISABLE);
        if (err != ESP_OK) {
            SERIAL_PRINT("set intr type failed with error: "); SERIAL_PRINTLN(err);
            return ESP_FAIL;
        }

        err = gpio_isr_handler_remove(gpioPin);
        if (err != ESP_OK) {
            SERIAL_PRINT("Handler removed failed with error: "); SERIAL_PRINTLN(err);
            return ESP_FAIL;
        }

        return ESP_OK;
    }


#endif