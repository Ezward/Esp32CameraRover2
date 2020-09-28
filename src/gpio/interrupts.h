#ifndef INTERRUPTS_H
#define INTERRUPTS_H

#include "gpio.h"

#if defined(ESP32)    
    #define FASTCODE IRAM_ATTR
    #define FASTDATA DRAM_ATTR

    // gpio interrupt modes
    #define DISABLE_INT GPIO_INTR_DISABLE
    #define RISING_EDGE GPIO_INTR_POSEDGE
    #define FALLING_EDGE GPIO_INTR_NEGEDGE
    #define CHANGING_EDGE GPIO_INTR_ANYEDGE
    #define LEVEL_LOW GPIO_INTR_LOW_LEVEL
    #define LEVEL_HIGH GPIO_INTR_HIGH_LEVEL

    #define ATTACH_ISR(_isr, _gpio, _mode) attachEsp32Interrupt((gpio_num_t)(_gpio), (_isr), (_mode))
    #define DETACH_ISR(_isr, _gpio) detachEsp32Interrupt((gpio_num_t)(_gpio))

    typedef gpio_isr_t isr_type;
    extern int attachEsp32Interrupt(gpio_num_t gpioPin, gpio_isr_t handler, gpio_int_type_t mode);
    extern int detachEsp32Interrupt(gpio_num_t gpioPin);
#else
    #define FASTCODE 
    #define FASTDATA 

    // gpio interrupt modes
    #define DISABLE_INT DISABLE
    #define RISING_EDGE RISING
    #define FALLING_EDGE FALLING
    #define CHANGING_EDGE CHANGE
    #define LEVEL_LOW ONLOW
    #define LEVEL_HIGH ONLOW

    #define ATTACH_ISR(_isr, _gpio, _mode) attachInterrupt(digitalPinToInterrupt(_gpio), (_isr), (_mode)); 
    #define DETACH_ISR(_isr, _gpio) detachInterrupt(digitalPinToInterrupt(gpio_num_t)(_gpio))

    typedef void (*isr_type)(void);
#endif

#endif
