#ifndef MESSAGES_H
#define MESSAGES_H

typedef enum Message {
    TEST = 0,
    HALT,               // wheel was halted, speed control disengaged
    WHEEL_POWER,        // wheel pwm was changed
    TARGET_SPEED,       // target speed was changed, speed control engaged
    SPEED_CONTROL,      // speed control was updated
    NUMBER_OF_MESSAGES  // THIS SHOULD ALWAYS BE LAST
} Message;

//
// array of strings that correspond to message numbers
//
extern const char *Messages[];

typedef enum Specifier {
    NONE = 0,
    LEFT_WHEEL,
    RIGHT_WHEEL,
    NUMBER_OF_SPECIFIERS    // THIS SHOULD ALWAYS BE LAST
} Specifier;

//
// array of strings that correspond to specifier numbers
//
extern const char *Specifiers[NUMBER_OF_SPECIFIERS];

#endif // MESSAGES_H
