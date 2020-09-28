#ifndef GPIO_GPIO_H
#define GPIO_GPIO_H

#ifndef Arduino_h
    #include <Arduino.h>
#endif

typedef unsigned char gpio_type;        // gpio pin number
typedef enum gpio_state {
    GPIO_LOW = 0,
    GPIO_HIGH = 1
} gpio_state;

#endif // GPIO_GPIO_H

