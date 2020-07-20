#include <Arduino.h>
#include "analogWrite.h"
#include "rover.h"


void roverStop();
void roverForward(uint8_t speed);
void roverReverse(uint8_t speed);
void roverTurnRight(uint8_t speed);
void roverTurnLeft(uint8_t speed);
void roverLeftWheel(bool forward, uint8_t speed);
void roverRightWheel(bool forward, uint8_t speed);

/******************************************************/
/****************rover control ************************/
/******************************************************/
uint8_t speedLeft = 0;
uint8_t speedRight = 0;
uint8_t forwardLeft = 1;
uint8_t forwardRight = 1;
uint8_t direction = ROVER_STOP;

int LEFT_FORWARD_PIN = -1;
int LEFT_REVERSE_PIN = -1;
int RIGHT_FORWARD_PIN = -1;
int RIGHT_REVERSE_PIN = -1;

const char *directionString[DIRECTION_COUNT] = {
    "stop",
    "forward",
    "right",
    "left",
    "reverse"
};

#define COMMAND_BUFFER_SIZE 16  // must be <= 256
uint8_t speedQueue[COMMAND_BUFFER_SIZE];     // circular queue of speed 0..255
uint8_t directionQueue[COMMAND_BUFFER_SIZE]; // circular queue of direction commands
uint8_t commandHead = 0; // read from head
uint8_t commandTail = 0; // append to tail

//
// set the rover pins
//
void roverInit(int leftForwardPin, int leftReversePin, int rightForwardPin, int rightReversePin)
{
    LEFT_FORWARD_PIN = leftForwardPin;
    LEFT_REVERSE_PIN = leftReversePin;
    RIGHT_FORWARD_PIN = rightForwardPin;
    RIGHT_REVERSE_PIN = rightReversePin;

    pinMode(LEFT_FORWARD_PIN, OUTPUT); analogWriteChannel(LEFT_FORWARD_PIN, 12);
    pinMode(LEFT_REVERSE_PIN, OUTPUT); analogWriteChannel(LEFT_REVERSE_PIN, 13);
    pinMode(RIGHT_FORWARD_PIN, OUTPUT); analogWriteChannel(RIGHT_FORWARD_PIN, 14);
    pinMode(RIGHT_REVERSE_PIN, OUTPUT); analogWriteChannel(RIGHT_REVERSE_PIN, 15);

}

// TODO: add immediate ROVER_HALT command that clears execution queue and stops immediately.
// TODO: add immediate ROVER_PAUSE command that pauses execution queue and stops immediately.
// TODO: add immediate ROVER_RESUME command that resumes execution queue.

//
// get a command as string parameters and add it to the command queue
//
int submitRoverCommand(
    const char *directionParam, // IN : direction as a string; "forward",
                                //      "reverse", "left", "right", or "stop"
    const char *speedParam)     // IN : speed as an integer string, "0".."255"
                                //      where "0" is stop,  "255" is full speed
                                // RET: 0 for SUCCESS, non-zero for error code
{
    //
    // validate speed param.
    //
    uint8_t speed;
    if (NULL != speedParam && strlen(speedParam) > 0)
    {
        int speedValue = atoi(speedParam);
        if ((speedValue >= 0) && (speedValue <= 255))
        {
            speed = speedValue;
        }
        else
        {
            return FAILURE; // speed param out of range
        }
    } 
    else 
    {
        return FAILURE; // no speed param
    }

    //
    // we must have a direction command.
    //
    if (NULL != directionParam && strlen(directionParam) > 0)
    {
        //
        // convert direction param to direction command
        if (0 == strcmp(directionParam, directionString[ROVER_STOP]))
        {
            return enqueueRoverCommand(ROVER_STOP, 0); 
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_FORWARD]))
        {
            return enqueueRoverCommand(ROVER_FORWARD, speed);
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_RIGHT]))
        {
            return enqueueRoverCommand(ROVER_RIGHT, speed);
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_LEFT]))
        {
            return enqueueRoverCommand(ROVER_LEFT, speed);
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_REVERSE]))
        {
            return enqueueRoverCommand(ROVER_REVERSE, speed);
        }
    }

    return FAILURE;
}


//
// Append a command to the command queue.
//
int enqueueRoverCommand(
    uint8_t directionCommand,   // IN : DirectionCommand
    uint8_t speedCommand)       // IN : 0..255 (0 stop, 255 full speed)
                                // RET: SUCCESS if command could be queued
                                //      FAILURE if buffer is full.
{
    //
    // insert new command at head of circular buffer
    // - if it would overlap tail, we can't fit it
    //
    uint8_t newCommandHead = (commandHead + 1) % COMMAND_BUFFER_SIZE;
    if (newCommandHead != commandTail) {
        directionQueue[commandHead] = directionCommand;
        speedQueue[commandHead] = speedCommand;
        commandHead = newCommandHead;
        return SUCCESS;
    }
    return FAILURE;
}

//
// Get the next command from the command queue. 
//
int dequeueRoverCommand(
    uint8_t *directionCommand,  // OUT: on SUCCESS, a DirectionCommand
                                //      otherwise unchanged.
    uint8_t *speedCommand)      // OUT: on SUCCESS, 0..255 (0 is stopped, 255 is full speed)
                                //      otherwise unchanged.
                                // RET: SUCCESS if buffer had a command to return 
                                //      FAILURE if buffer is empty.
{
    //
    // Read command from tail and increment tail index
    //
    if (commandHead != commandTail) {
        *directionCommand = directionQueue[commandTail];
        *speedCommand = speedQueue[commandTail];
        commandTail = (commandTail + 1) % COMMAND_BUFFER_SIZE;
        return SUCCESS;
    }
    return FAILURE;
}

//
// execute the given rover command
//
int executeRoverCommand(
    uint8_t directionCommand,   // IN : DirectionCommand
    SpeedCommand speedCommand)  // IN : 0..MAX_SPEED_COMMAND (0 stop, MAX_SPEED_COMMAND full speed)
                                // RET: SUCCESS if command is valid DirectionCommand
                                //      FAILURE if command is not a DirectionCommand.
{
    switch (directionCommand) {
        case ROVER_STOP: {
            roverStop();
            return SUCCESS;
        }
        case ROVER_FORWARD: {
            roverForward(speedCommand);
            return SUCCESS;
        }
        case ROVER_RIGHT: {
            roverTurnRight(speedCommand);
            return SUCCESS;
        }
        case ROVER_LEFT: {
            roverTurnLeft(speedCommand);
            return SUCCESS;
        }
        case ROVER_REVERSE: {
            roverReverse(speedCommand);
            return SUCCESS;
        }
        default: {
            return FAILURE;
        }
    }
}


uint8_t roverGetDirection() // RET: currently executing direction
{
    if(0 == speedLeft && 0 == speedRight) {
        return ROVER_STOP;
    }

    if(forwardLeft) {
        return forwardRight ? ROVER_FORWARD : ROVER_RIGHT;
    }

    // left wheel is in reverse
    return forwardRight ? ROVER_LEFT : ROVER_REVERSE;
}



void roverLeftWheel(bool forward, SpeedCommand speed) {    
    if(true == (forwardLeft = forward)) {
        analogWrite(LEFT_FORWARD_PIN, speedLeft = speed);
        analogWrite(LEFT_REVERSE_PIN, 0);
    }
    else {
        analogWrite(LEFT_FORWARD_PIN, 0);
        analogWrite(LEFT_REVERSE_PIN, speedLeft = speed);
    }
}

void roverRightWheel(bool forward, SpeedCommand speed) {
    if(true == (forwardRight = forward)) {
        analogWrite(RIGHT_FORWARD_PIN, speedRight = speed);
        analogWrite(RIGHT_REVERSE_PIN, 0);
    }
    else {
        analogWrite(RIGHT_FORWARD_PIN, 0);
        analogWrite(RIGHT_REVERSE_PIN, speedRight = speed);
    }
}

void roverStop()
{
    if (-1 == LEFT_FORWARD_PIN)
        return;

    roverLeftWheel(true, 0);
    roverRightWheel(true, 0);
}

void roverForward(SpeedCommand speed)
{
    if (-1 == LEFT_FORWARD_PIN)
        return;

    roverLeftWheel(true, speed);
    roverRightWheel(true, speed);
}
void roverReverse(SpeedCommand speed)
{
    if (-1 == LEFT_FORWARD_PIN)
        return;

    roverLeftWheel(false, speed);
    roverRightWheel(false, speed);
}
void roverTurnRight(SpeedCommand speed)
{
    if (-1 == LEFT_FORWARD_PIN)
        return;

    roverLeftWheel(true, speed);
    roverRightWheel(false, speed);
}
void roverTurnLeft(SpeedCommand speed)
{
    if (-1 == LEFT_FORWARD_PIN)
        return;

    roverLeftWheel(false, speed);
    roverRightWheel(true, speed);
}
