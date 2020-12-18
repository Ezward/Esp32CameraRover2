#include "messages.h"

const char *Messages[NUMBER_OF_MESSAGES] = {
    "TEST",
    "LOG_CLIENT",         // send log message to client
    "WHEEL_HALT",         // wheel was halted, speed control disengaged
    "WHEEL_POWER",        // wheel pwm was changed
    "TARGET_SPEED",       // target speed was changed, speed control engaged
    "SPEED_CONTROL",      // speed control was updated
    "MOTOR_STALL",        // motor stall value was changed
    "ROVER_POSE",         // rover position and/or orientation changed
};

const char *Specifiers[NUMBER_OF_SPECIFIERS] = {
    "NONE",
    "LEFT_WHEEL",
    "RIGHT_WHEEL",
    "ROVER"
};

