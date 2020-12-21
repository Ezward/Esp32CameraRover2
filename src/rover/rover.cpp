#include <Arduino.h>
#include "rover.h"
#include "rover_parse.h"
#include "encoder/encoder.h"
#include "string/strcopy.h"
#include "util/math.h"


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
    return (NULL != _leftWheel);
}

/**
 * Attach rover dependencies
 */
TwoWheelRover& TwoWheelRover::attach(
    DriveWheel &leftWheel,  // IN : left drive wheel in attached state
    DriveWheel &rightWheel, // IN : right drive wheel in attached state
    MessageBus *messageBus) // IN : pointer to MessageBus to publish state changes
                            //      or NULL to not publish state changes
                            // RET: this rover in attached state
{
    if(!attached()) {
        // motors should already be in attached state
        _leftWheel = &leftWheel;
        _rightWheel = &rightWheel;
        _messageBus = messageBus;
    }

    return *this;
}

/**
 * Detach rover dependencies
 */
TwoWheelRover& TwoWheelRover::detach() // RET: this rover in detached state
{
    if(attached()) {
        _leftWheel = NULL;
        _rightWheel = NULL;
    }

    return *this;
}


/**
 * Distance between drive wheels
 */
distance_type TwoWheelRover::wheelBase() // RET: distance between drive wheels
{
    return _wheelBase;
}

/**
 * Set speed control parameters
 */
TwoWheelRover& TwoWheelRover::setSpeedControl(
    WheelId wheels,         // IN : bit flags for wheels to apply 
    speed_type minSpeed,    // IN : minimum speed of motor below which it stalls
    speed_type maxSpeed,    // IN : maximum speed of motor
    float Kp,               // IN : proportional gain
    float Ki,               // IN : integral gain
    float Kd)               // IN : derivative gain
                            // RET: this TwoWheelRover
{
    if(attached()) {
        if(wheels & LEFT_WHEEL) {
            if(nullptr != _leftWheel) _leftWheel->setSpeedControl(minSpeed, maxSpeed, Kp, Ki, Kd);
        }
        if(wheels & RIGHT_WHEEL) {
            if(nullptr != _rightWheel) _rightWheel->setSpeedControl(minSpeed, maxSpeed, Kp, Ki, Kd);
        }
    }
    return *this;
}

/**
 * Set motor stall values
 */
TwoWheelRover& TwoWheelRover::setMotorStall(
    float left,  // IN : (0 to 1.0) fraction of full pwm 
                 //      at which left motor stalls
    float right) // IN : (0 to 1.0) fraction of full pwm 
                 //      at which right motor stalls
                 // RET: this TwoWheelRovel
{
    if(attached()) {
        if(nullptr != _leftWheel) _leftWheel->setStall(left);
        if(nullptr != _rightWheel) _rightWheel->setStall(right);
    }
    return *this;
}

/**
 * Read value of left wheel encoder
 */
encoder_count_type TwoWheelRover::readLeftWheelEncoder() // RET: wheel encoder count
{
    return (NULL != _leftWheel) ? _leftWheel->readEncoder() : 0;
}

/**
 * Read value of right wheel encoder
 */
encoder_count_type TwoWheelRover::readRightWheelEncoder() // RET: wheel encoder count
{
    return (NULL != _rightWheel) ? _rightWheel->readEncoder() : 0;
}



/**
 * Add a command, as string parameters, to the command queue
 */
int TwoWheelRover::submitTurtleCommand(
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
SubmitCommandResult TwoWheelRover::submitCommand(
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
                case STALL: {
                    // execute control command immediately
                    StallCommand stall = parsed.command.stall;
                    setMotorStall(stall.leftStall, stall.rightStall);
                    return {SUCCESS, parsed.id, parsed.command};
                }
                case PID: {
                    // execute control command immediately
                    PidCommand& pid = parsed.command.pid;
                    setSpeedControl(pid.wheels, pid.minSpeed, pid.maxSpeed, pid.Kp, pid.Ki, pid.Kd);
                    return {SUCCESS, parsed.id, parsed.command};
                }
                case HALT: {
                    // execute halt immediately
                    roverHalt();
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
                case NOOP: {
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
    TankCommand &command)   // IN : speed/direction for both wheels
                            // RET: SUCCESS if command executed
                            //      FAILURE if command could not execute
{
    if (!attached())
        return FAILURE;

    roverLeftWheel(command.useSpeedControl, command.left.forward, command.left.value);
    roverRightWheel(command.useSpeedControl, command.right.forward, command.right.value);

    return SUCCESS;
}

/**
 * immediately 
 * - stop the rover and 
 * - disengage speed controller and 
 * - clear command queue
 */
TwoWheelRover& TwoWheelRover::roverHalt()   // RET: this rover
{
    if (!attached())
        return *this;

    // clear the command buffer
    _commandHead = 0; 
    _commandTail = 0; 

    // halt the rover
    if(NULL != _leftWheel) {
        _leftWheel->halt();
    }
    if(NULL != _rightWheel) {
        _rightWheel->halt();
    }

    return *this;
}

/**
 * send speed and direction to wheel
 */
TwoWheelRover& TwoWheelRover::_roverWheelSpeed(
    DriveWheel* wheel,      // IN : the wheel to control
    bool useSpeedControl,   // IN : true to call setSpeed() and enable speed controller
                            //      false to call setPower() and disable speed controller
    bool forward,           // IN : true to move wheel in forward direction
                            //      false to move wheel in reverse direction
    SpeedValue speed)       // IN : target speed for wheel
                            // RET: this TwoWheelRover
{
    if (attached()) {
        if(nullptr != wheel) {
            if(useSpeedControl) {
                wheel->setSpeed(forward ? speed : -speed);
            } else {
                wheel->setPower(forward, speed);
            }
        }
    }
    return *this;
}

/**
 * send speed and direction to left wheel
 */
TwoWheelRover& TwoWheelRover::roverLeftWheel(
    bool useSpeedControl,   // IN : true to call setSpeed() and enable speed controller
                            //      false to call setPower() and disable speed controller
    bool forward,           // IN : true to move wheel in forward direction
                            //      false to move wheel in reverse direction
    SpeedValue speed)       // IN : target speed for wheel
                            // RET: this TwoWheelRover
{
    return _roverWheelSpeed(_leftWheel, useSpeedControl, forward, speed);
}

/**
 * send speed and direction to right wheel
 */
TwoWheelRover& TwoWheelRover::roverRightWheel(
    bool useSpeedControl,   // IN : true to call setSpeed() and enable speed controller
                            //      false to call setPower() and disable speed controller
    bool forward,           // IN : true to move wheel in forward direction
                            //      false to move wheel in reverse direction
    SpeedValue speed)       // IN : target speed for wheel
                            // RET: this TwoWheelRover
{
    return _roverWheelSpeed(_rightWheel, useSpeedControl, forward, speed);
}

/**
 * Get the last poll time in ms from startup
 */
unsigned long TwoWheelRover::lastPoseMs()   // RET: time of last poll in ms
{
    return _lastPoseMs;
}


/**
 * Get the most recently calcualted pose
 */
Pose2D TwoWheelRover::pose()   // RET: most recently calculated pose
{
    return _lastPose;
}


/**
 * Poll rover systems
 */
TwoWheelRover& TwoWheelRover::poll() // RET: this rover
{
    if(attached()) {
        _pollPose();
        _pollWheels();
        _pollRoverCommand();
    }
    return *this;
}

/**
 * Poll command queue
 */
TwoWheelRover& TwoWheelRover::_pollRoverCommand() // RET: this rover
{
    TankCommand command;
    if (SUCCESS == dequeueRoverCommand(&command)) {
        executeRoverCommand(command);
    }

    return *this;
}

/**
 * Poll wheel encoders
 */
TwoWheelRover& TwoWheelRover::_pollWheels() // RET: this rover
{
    if(nullptr != _rightWheel) {
        _rightWheel->poll();
    }
    if(nullptr != _leftWheel) {
        _leftWheel->poll();
    }

    return *this;
}

/**
 * limit angle to 2 * pi randians (one full circle)
 */
const distance_type _twoPi = 2 * PI;
distance_type limitAngle(distance_type angle) {
    while(angle >= _twoPi) {
        angle -= _twoPi;
    }
    while(angle < 0) {
        angle += _twoPi;
    }

    return angle;
}

/**
 * Poll to update the rover pose (x, y, angle)
 */
TwoWheelRover& TwoWheelRover::_pollPose() // RET: this rover
{
    if(attached()) {
        //
        // determine if enough time has gone by to run speed control
        //
        const unsigned long currentMillis = millis();
        if(0 == _lastPoseMs) {
            // initialize
            _lastPose.x = 0;
            _lastPose.y = 0;
            _lastPose.angle = 0;   // pointing right
            _lastVelocity.x = 0;
            _lastVelocity.y = 0;
            _lastVelocity.angle = 0;
            _lastPoseMs = currentMillis;
            _lastRightCount = readRightWheelEncoder();
            _lastLeftCount = readLeftWheelEncoder();
        } else if(currentMillis >= (_lastPoseMs + _pollPoseMillis)) {
            // TODO: we should rotate the order of reading wheel encoders to avoid systematic errors
            const encoder_count_type rightWheelCount = readRightWheelEncoder();
            const encoder_count_type leftWheelCount = readLeftWheelEncoder();

            const distance_type lastLeftDistance =  _leftWheel->circumference() * (distance_type)_lastLeftCount / _leftWheel->countsPerRevolution();
            const distance_type currentLeftDistance =  _leftWheel->circumference() * (distance_type)leftWheelCount / _leftWheel->countsPerRevolution();
            const distance_type leftDeltaDistance = currentLeftDistance - lastLeftDistance;

            const distance_type lastRightDistance =  _rightWheel->circumference() * (distance_type)_lastRightCount / _rightWheel->countsPerRevolution();
            const distance_type currentRightDistance =  _rightWheel->circumference() * (distance_type)rightWheelCount / _rightWheel->countsPerRevolution();
            const distance_type rightDeltaDistance = currentRightDistance - lastRightDistance; 

            // distance and velocity at center of rover
            const distance_type deltaDistance = (rightDeltaDistance + leftDeltaDistance) / 2;
            // const speed_type linearVelocity = deltaDistance / deltaTimeSec;

            const distance_type deltaTimeSec = (currentMillis - _lastPoseMs) / 1000.0;
            const distance_type deltaAngle = (rightDeltaDistance - leftDeltaDistance) / _wheelBase;
            const speed_type angularVelocity = deltaAngle / deltaTimeSec;

            // new position and orientation
            const distance_type estimatedAngle = limitAngle(_lastPose.angle + deltaAngle / 2);  // assume mid point of orientation change when calculated updated position
            const distance_type x = _lastPose.x + deltaDistance * cosf(estimatedAngle);
            const distance_type y = _lastPose.y + deltaDistance * sinf(estimatedAngle);
            const distance_type angle = limitAngle(_lastPose.angle + deltaAngle);

            //
            // update velocities
            //
            _lastVelocity.x = (x - _lastPose.x) / deltaTimeSec;
            _lastVelocity.y = (y - _lastPose.y) / deltaTimeSec;
            _lastVelocity.angle = angularVelocity;

            // 
            // update pose
            //
            _lastPose.x = x;
            _lastPose.y = y;
            _lastPose.angle = angle;

            // 
            // record keeping
            //
            _lastPoseMs = currentMillis;
            _lastLeftCount = leftWheelCount;
            _lastRightCount = rightWheelCount;

            // publish speed control message
            if(nullptr != _messageBus) {
                publish(*_messageBus, ROVER_POSE, ROVER_SPEC);
            }
        }
    }

    return *this;
}

