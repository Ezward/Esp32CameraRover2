#include <Arduino.h>
#include "rover.h"


void roverStop();
void roverForward();
void roverReverse();
void roverTurnRight();
void roverTurnLeft();
void roverSetSpeed(byte inSpeed);
uint8_t roverGetSpeed();

/******************************************************/
/****************rover control ************************/
/******************************************************/
uint8_t speed = 0;
uint8_t direction = ROVER_STOP;

int AIA_PIN = -1;
int AIB_PIN = -1;
int BIA_PIN = -1;
int BIB_PIN = -1;

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
void roverInit(int a1, int a2, int b1, int b2)
{
    AIA_PIN = a1;
    AIB_PIN = a2;
    BIA_PIN = b1;
    BIB_PIN = b2;

    pinMode(AIA_PIN, OUTPUT);
    pinMode(AIB_PIN, OUTPUT);
    pinMode(BIA_PIN, OUTPUT);
    pinMode(BIB_PIN, OUTPUT);
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
    uint8_t speedCommand)       // IN : 0..255 (0 stop, 255 full speed)
                                // RET: SUCCESS if command is valid DirectionCommand
                                //      FAILURE if command is not a DirectionCommand.
{
    switch (directionCommand) {
        case ROVER_STOP: {
            roverSetSpeed(0);
            roverStop();
            return SUCCESS;
        }
        case ROVER_FORWARD: {
            roverSetSpeed(speedCommand);
            roverForward();
            return SUCCESS;
        }
        case ROVER_RIGHT: {
            roverSetSpeed(speedCommand);
            roverTurnRight();
            return SUCCESS;
        }
        case ROVER_LEFT: {
            roverSetSpeed(speedCommand);
            roverTurnLeft();
            return SUCCESS;
        }
        case ROVER_REVERSE: {
            roverSetSpeed(speedCommand);
            roverReverse();
            return SUCCESS;
        }
        default: {
            return FAILURE;
        }
    }
}


void roverSetSpeed(uint8_t inSpeed)
{
    speed = inSpeed;
}

uint8_t roverGetSpeed() // RET: currently executing speed
{
    return speed;
}

uint8_t roverGetDirection() // RET: currently executing direction
{
    return direction;
}

void roverStop()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, LOW);
    digitalWrite(AIB_PIN, LOW);
    digitalWrite(BIA_PIN, LOW);
    digitalWrite(BIB_PIN, LOW);
    direction = ROVER_STOP;
}
void roverForward()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, HIGH);
    digitalWrite(AIB_PIN, LOW);
    digitalWrite(BIA_PIN, LOW);
    digitalWrite(BIB_PIN, HIGH);
    direction = ROVER_FORWARD;
}
void roverReverse()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, LOW);
    digitalWrite(AIB_PIN, HIGH);
    digitalWrite(BIA_PIN, HIGH);
    digitalWrite(BIB_PIN, LOW);
    direction = ROVER_REVERSE;
}
void roverTurnRight()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, HIGH);
    digitalWrite(AIB_PIN, LOW);
    digitalWrite(BIA_PIN, HIGH);
    digitalWrite(BIB_PIN, LOW);
    direction = ROVER_RIGHT;
}
void roverTurnLeft()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, LOW);
    digitalWrite(AIB_PIN, HIGH);
    digitalWrite(BIA_PIN, LOW);
    digitalWrite(BIB_PIN, HIGH);
    direction = ROVER_LEFT;
}
