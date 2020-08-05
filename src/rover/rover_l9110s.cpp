#include <Arduino.h>
#include "analogWrite.h"
#include "rover.h"
#include "rover_parse.h"
#include "string/strcopy.h"


void roverLeftWheel(bool forward, uint8_t speed);
void roverRightWheel(bool forward, uint8_t speed);

/******************************************************/
/****************rover control ************************/
/******************************************************/
uint8_t speedLeft = 0;
uint8_t speedRight = 0;
uint8_t forwardLeft = 1;
uint8_t forwardRight = 1;

int LEFT_FORWARD_PIN = -1;
int LEFT_REVERSE_PIN = -1;
int RIGHT_FORWARD_PIN = -1;
int RIGHT_REVERSE_PIN = -1;

// turtle commands
typedef enum {
    ROVER_STOP,
    ROVER_FORWARD,
    ROVER_RIGHT,
    ROVER_LEFT,
    ROVER_REVERSE,
    DIRECTION_COUNT
} DirectionCommands;

typedef uint8_t DirectionCommand;

const char *directionString[DIRECTION_COUNT] = {
    "stop",
    "forward",
    "right",
    "left",
    "reverse"
};

#define COMMAND_BUFFER_SIZE 16  // must be <= 256
TankCommand commandQueue[COMMAND_BUFFER_SIZE];     // circular queue of commands
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

bool isInitialized() {  // RET: true if initialized, false if not
    return (-1 != LEFT_FORWARD_PIN);
}

//
// get a command as string parameters and add it to the command queue
//
int submitTurtleCommand(
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
        // convert direction param to tank command
        //
        if (0 == strcmp(directionParam, directionString[ROVER_STOP]))
        {
            return enqueueRoverCommand({{true, 0}, {true, 0}}); 
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_FORWARD]))
        {
            return enqueueRoverCommand({{true, speed}, {true, speed}});
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_RIGHT]))
        {
            return enqueueRoverCommand({{true, speed}, {false, speed}});
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_LEFT]))
        {
            return enqueueRoverCommand({{false, speed}, {true, speed}});
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_REVERSE]))
        {
            return enqueueRoverCommand({{false, speed}, {false, speed}});
        }
    }

    return FAILURE;
}


/*
** submit the tank command that was
** send in the websocket channel
*/
SubmitTankCommandResult submitTankCommand(
    const char *commandParam,   // IN : A wrapped tank command link cmd(tank(...))
    const int offset)           // IN : offset of cmd() wrapper in command buffer
                                // RET: struct with status, command id and command
                                //      where status == SUCCESS or
                                //      status == -1 on bad command (null or empty)
                                //      status == -2 on parse error
                                //      status == -3 on enqueue error (queue is full)
{
    int error = COMMAND_BAD_FAILURE;
    if((NULL != commandParam) && (offset >= 0)) {
        //
        // parse the command from the buffer
        // like: tank(true, 128, false, 196)
        //
        String command = String(commandParam);
        ParseCommandResult cmd = parseCommand(command, offset);
        if(cmd.matched) {
            if(SUCCESS == enqueueRoverCommand(cmd.tank)) {
                return {SUCCESS, cmd.id, cmd.tank};
            } else {
                error = COMMAND_ENQUEUE_FAILURE;
            }
        } else {
            error = COMMAND_PARSE_FAILURE;
        }
    }

    return {error, 0, {{0, true}, {0, true}}};
}


//
// Append a command to the command queue.
//
int enqueueRoverCommand(
    TankCommand command)    // IN : speed/direction for both wheels
                            // RET: SUCCESS if command could be queued
                            //      FAILURE if buffer is full.
{
    //
    // insert new command at head of circular buffer
    // - if it would overlap tail, we can't fit it
    //
    uint8_t newCommandHead = (commandHead + 1) % COMMAND_BUFFER_SIZE;
    if (newCommandHead != commandTail) {
        commandQueue[commandHead] = command;
        commandHead = newCommandHead;
        return SUCCESS;
    }
    return FAILURE;
}

//
// Get the next command from the command queue. 
//
int dequeueRoverCommand(
    TankCommand *command)   // OUT: on SUCCESS, speed/direction for both wheels
                            //      otherwise unchanged.
                            // RET: SUCCESS if buffer had a command to return 
                            //      FAILURE if buffer is empty.
{
    //
    // Read command from tail and increment tail index
    //
    if (commandHead != commandTail) {
        *command = commandQueue[commandTail];
        commandTail = (commandTail + 1) % COMMAND_BUFFER_SIZE;
        return SUCCESS;
    }
    return FAILURE;
}

//
// execute the given rover command
//
int executeRoverCommand(
    TankCommand command)    // IN : speed/direction for both wheels
                            // RET: SUCCESS if command executed
                            //      FAILURE if command could not execute
{
    if (!isInitialized())
        return FAILURE;

    roverLeftWheel(command.left.forward, command.left.value);
    roverRightWheel(command.right.forward, command.right.value);

    return SUCCESS;
}


/*
** send speed and direction to left wheel
*/
void roverLeftWheel(bool forward, SpeedValue speed) {    
    if (!isInitialized())
        return;

    if(true == (forwardLeft = forward)) {
        analogWrite(LEFT_FORWARD_PIN, speedLeft = speed);
        analogWrite(LEFT_REVERSE_PIN, 0);
    }
    else {
        analogWrite(LEFT_FORWARD_PIN, 0);
        analogWrite(LEFT_REVERSE_PIN, speedLeft = speed);
    }
}

/*
** send speed and direction to right wheel
*/
void roverRightWheel(bool forward, SpeedValue speed) {
    if (!isInitialized())
        return;

    if(true == (forwardRight = forward)) {
        analogWrite(RIGHT_FORWARD_PIN, speedRight = speed);
        analogWrite(RIGHT_REVERSE_PIN, 0);
    }
    else {
        analogWrite(RIGHT_FORWARD_PIN, 0);
        analogWrite(RIGHT_REVERSE_PIN, speedRight = speed);
    }
}

/*
** immediately stop the rover and clear command queue
*/
void roverHalt()
{
    // clear the command buffer
    commandHead = 0; 
    commandTail = 0; 

    // stop the rover
    roverLeftWheel(true, 0);
    roverRightWheel(true, 0);
}
