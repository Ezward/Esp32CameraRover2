#include "./rover_command.h"
#include "./rover_parse.h"

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

const char *CommandNames[] = {
    "noop",
    "halt",
    "tank",
    "pid",
    "stall",
    "resetPose",
};


/**
 * Determine if rover's dependencies are attached
 */
bool RoverCommandProcessor::attached() {
    return (NULL != _rover);
}

/**
 * Attach dependencies
 */
RoverCommandProcessor& RoverCommandProcessor::attach(
    TwoWheelRover &rover,               // IN : left drive wheel in attached state
    GotoGoalBehavior &gotoGoalBehavior) // IN : right drive wheel in attached state
                                        // RET: this behavior in attached state
{
    if(!attached()) {
        _rover = &rover;
        _gotoGoalBehavior = &gotoGoalBehavior;
    }

    return *this;
}

/**
 * Detach dependencies
 */
RoverCommandProcessor& RoverCommandProcessor::detach() // RET: this behavior in detached state
{
    if(attached()) {
        _rover = nullptr;
        _gotoGoalBehavior = nullptr;
    }

    return *this;
}



/**
 * Add a command, as string parameters, to the command queue
 */
int RoverCommandProcessor::submitTurtleCommand(
    boolean useSpeedControl,    // IN : true if command is a speed command
                                //      false if command is a pwm command
    const char *directionParam, // IN : direction as a string; "forward",
                                //      "reverse", "left", "right", or "stop"
    const char *speedParam)     // IN : speed as an numeric string
                                //      - if useSpeedControl is true, speed >= 0
                                //      - if useSpeedControl is false, 0 >= speed >= 255
                                // RET: 0 for SUCCESS, non-zero for error code
{
    //
    // validate speed param.
    //
    SpeedValue speed;
    if (NULL != speedParam && strlen(speedParam) > 0)
    {
        if(useSpeedControl) {
            SpeedValue speedValue = atof(speedParam);
            if(speedValue >= 0) {
                speed = speedValue;
            } 
            else {
                return FAILURE; //speed param out of range
            }
        } 
        else {
            int speedValue = atoi(speedParam);
            if ((speedValue >= 0) && (speedValue <= 255)) {
                speed = speedValue;
            } 
            else {
                return FAILURE; // speed param out of range
            }
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
            return enqueueRoverCommand({useSpeedControl, {true, 0}, {true, 0}}); 
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_FORWARD]))
        {
            return enqueueRoverCommand({useSpeedControl, {true, speed}, {true, speed}});
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_RIGHT]))
        {
            return enqueueRoverCommand({useSpeedControl, {true, speed}, {false, speed}});
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_LEFT]))
        {
            return enqueueRoverCommand({useSpeedControl, {false, speed}, {true, speed}});
        }
        else if (0 == strcmp(directionParam, directionString[ROVER_REVERSE]))
        {
            return enqueueRoverCommand({useSpeedControl, {false, speed}, {false, speed}});
        }
    }

    return FAILURE;
}

/*
** submit the command that was
** send in the websocket channel
*/
SubmitCommandResult RoverCommandProcessor::submitCommand(
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
        ParseCommandResult parsed = parseCommand(command, offset);
        if(parsed.matched) {
            switch(parsed.command.type) {
                case NOOP: {
                    return {SUCCESS, parsed.id, parsed.command};
                }
                case HALT: {
                    // execute halt immediately
                    _rover->roverHalt();
                    _gotoGoalBehavior->cancel();
                    return {SUCCESS, parsed.id, parsed.command};
                }
                case TANK: {
                    // queue up movement command
                    TankCommand& tank = parsed.command.tank;
                    if(SUCCESS == enqueueRoverCommand(tank)) {
                        return {SUCCESS, parsed.id, parsed.command};
                    } else {
                        error = COMMAND_ENQUEUE_FAILURE;
                    }
                    break;
                }
                case PID: {
                    // execute control command immediately
                    PidCommand& pid = parsed.command.pid;
                    _rover->setSpeedControl(pid.wheels, pid.minSpeed, pid.maxSpeed, pid.Kp, pid.Ki, pid.Kd);
                    return {SUCCESS, parsed.id, parsed.command};
                }
                case STALL: {
                    // execute control command immediately
                    StallCommand stall = parsed.command.stall;
                    _rover->setMotorStall(stall.leftStall, stall.rightStall);
                    return {SUCCESS, parsed.id, parsed.command};
                }
                case RESET_POSE: {
                    // execute reset pose immediately
                    _rover->resetPose();
                    return {SUCCESS, parsed.id, parsed.command};
                }
                case GOTO: {
                    if(_gotoGoalBehavior) {
                        const GotoCommand go2 = parsed.command.go2;
                        _gotoGoalBehavior->gotoGoal(go2.x, go2.y, go2.pointForward, go2.tolerance).poll(millis());
                    }
                    return {SUCCESS, parsed.id, parsed.command};
                }
                default: {
                    error = COMMAND_PARSE_FAILURE;
                    break;
                }
            }
        } else {
            error = COMMAND_PARSE_FAILURE;
        }
    }

    return {error, 0, RoverCommand()};
}

/**
 * Append a command to the command queue.
 */
int RoverCommandProcessor::enqueueRoverCommand(
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
int RoverCommandProcessor::dequeueRoverCommand(
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
int RoverCommandProcessor::executeRoverCommand(
    TankCommand &command)   // IN : speed/direction for both wheels
                            // RET: SUCCESS if command executed
                            //      FAILURE if command could not execute
{
    if (!attached())
        return FAILURE;

    _rover->roverLeftWheel(command.useSpeedControl, command.left.forward, command.left.value);
    _rover->roverRightWheel(command.useSpeedControl, command.right.forward, command.right.value);

    return SUCCESS;
}

/**
 * Poll command queue
 */
RoverCommandProcessor& RoverCommandProcessor::pollRoverCommand(
    unsigned long currentMillis)   // IN : milliseconds since startup
                                   // RET: this rover
{
    TankCommand command;
    if (SUCCESS == dequeueRoverCommand(&command)) {
        executeRoverCommand(command);
    }

    return *this;
}

