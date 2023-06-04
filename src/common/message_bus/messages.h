#ifndef MESSAGES_H
#define MESSAGES_H

typedef enum Message {
    TEST = 0,
    LOG_CLIENT,         // send log message to client
    WHEEL_HALT,         // wheel was halted, speed control disengaged
    WHEEL_POWER,        // wheel pwm was changed
    TARGET_SPEED,       // target speed was changed, speed control engaged
    SPEED_CONTROL,      // speed control was updated
    MOTOR_STALL,        // motor stall value was changed
    ROVER_POSE,         // current rover position and orientation {x, y, angle}
    GOTO_GOAL,          // goto goal update
    NUMBER_OF_MESSAGES  // THIS SHOULD ALWAYS BE LAST
} Message;

//
// array of strings that correspond to message numbers
//
extern const char *Messages[];

typedef enum Specifier {
    NONE = 0,
    LEFT_WHEEL_SPEC,
    RIGHT_WHEEL_SPEC,
    ROVER_SPEC,
    BEHAVIOR_SPEC,
    NUMBER_OF_SPECIFIERS    // THIS SHOULD ALWAYS BE LAST
} Specifier;

//
// array of strings that correspond to specifier numbers
//
extern const char *Specifiers[NUMBER_OF_SPECIFIERS];

#endif // MESSAGES_H
