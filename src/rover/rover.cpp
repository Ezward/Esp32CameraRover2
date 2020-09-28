#include <Arduino.h>
#include "rover.h"
#include "rover_parse.h"
#include "string/strcopy.h"
#include "../encoders.h"


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


//
// TODO ---------------------------------
// SpeedValue should be 0 to 1.0.  
// if we have encoders and PID controller,
// use this to scale maximum encoder pulse rate
// and use this as the PID target value.
// If we do not have encoders, 
// use speed value to scale maximum pwm value
// and write that into the motor directly.
//


/**
 * Deteremine if rover's dependencies are attached
 */
bool TwoWheelRover::attached() {
    return (NULL != _leftMotor);
}

/**
 * Attach rover dependencies
 */
TwoWheelRover& TwoWheelRover::attach(
    MotorL9110s &leftMotor, // IN : left wheel's motor
    MotorL9110s &rightMotor)// IN : right wheel's motor
                            // RET: this rover in attached state
{
    if(!attached()) {
        _leftMotor = &leftMotor;
        _rightMotor = &rightMotor;
    }

    return *this;
}

/**
 * Detach rover dependencies
 */
TwoWheelRover& TwoWheelRover::detach() // RET: this rover in detached state
{
    if(attached()) {
        _leftMotor = NULL;
        _rightMotor = NULL;
    }

    return *this;
}

/**
 * Add a command, as string parameters, to the command queue
 */
int TwoWheelRover::submitTurtleCommand(
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
SubmitTankCommandResult TwoWheelRover::submitTankCommand(
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

/**
 * Append a command to the command queue.
 */
int TwoWheelRover::enqueueRoverCommand(
    TankCommand command)    // IN : speed/direction for both wheels
                            // RET: SUCCESS if command could be queued
                            //      FAILURE if buffer is full.
{
    //
    // insert new command at head of circular buffer
    // - if it would overlap tail, we can't fit it
    //
    uint8_t newCommandHead = (_commandHead + 1) % COMMAND_BUFFER_SIZE;
    if (newCommandHead != _commandTail) {
        _commandQueue[_commandHead] = command;
        _commandHead = newCommandHead;
        return SUCCESS;
    }
    return FAILURE;
}

/**
 * Get the next command from the command queue.
 */
int TwoWheelRover::dequeueRoverCommand(
    TankCommand *command)   // OUT: on SUCCESS, speed/direction for both wheels
                            //      otherwise unchanged.
                            // RET: SUCCESS if buffer had a command to return 
                            //      FAILURE if buffer is empty.
{
    //
    // Read command from tail and increment tail index
    //
    if (_commandHead != _commandTail) {
        *command = _commandQueue[_commandTail];
        _commandTail = (_commandTail + 1) % COMMAND_BUFFER_SIZE;
        return SUCCESS;
    }
    return FAILURE;
}

/**
 * Execute the given rover command
 */
int TwoWheelRover::executeRoverCommand(
    TankCommand &command)    // IN : speed/direction for both wheels
                            // RET: SUCCESS if command executed
                            //      FAILURE if command could not execute
{
    if (!attached())
        return FAILURE;

    roverLeftWheel(command.left.forward, command.left.value);
    setLeftEncoderDirection(
        (0 == command.left.value) 
        ? encode_stopped 
        : (command.left.forward ? encode_forward : encode_reverse));

    roverRightWheel(command.right.forward, command.right.value);
    setRightEncoderDirection(
        (0 == command.right.value) 
        ? encode_stopped 
        : (command.right.forward ? encode_forward : encode_reverse));

    return SUCCESS;
}

/**
 * immediately stop the rover and clear command queue
 */
void TwoWheelRover::roverHalt()
{
    // clear the command buffer
    _commandHead = 0; 
    _commandTail = 0; 

    // stop the rover
    roverLeftWheel(true, 0);
    roverRightWheel(true, 0);
}


/**
 * send speed and direction to left wheel
 */
void TwoWheelRover::roverLeftWheel(
        bool forward,       // IN : true to move wheel in forward direction
                            //      false to move wheel in reverse direction
        SpeedValue speed)   // IN : target speed for wheel
{
    if (!attached())
        return;

    _leftMotor->setPower(forward, speed);
}

/**
 * send speed and direction to right wheel
 */
void TwoWheelRover::roverRightWheel(
        bool forward,       // IN : true to move wheel in forward direction
                            //      false to move wheel in reverse direction
        SpeedValue speed)   // IN : target speed for wheel
{
    if (!attached())
        return;

    _rightMotor->setPower(forward, speed);
}
