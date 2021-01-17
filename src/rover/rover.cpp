// #include <Arduino.h>
#include "rover.h"
#include "rover_parse.h"
#include "encoder/encoder.h"
#include "string/strcopy.h"
#include "util/math.h"
#include "goto_goal.h"



/**
 * Determine if rover's dependencies are attached
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
 * Get calibrated minimum forward speed for rover
 */
speed_type TwoWheelRover::minimumSpeed() // RET: calibrated minimum speed
{
    if(attached()) {
        return max<distance_type>(_leftWheel->minimumSpeed(), _rightWheel->minimumSpeed());
    }
    return 0;
}

/**
 * Get calibrated maximum forward speed for rover
 */
speed_type TwoWheelRover::maximumSpeed() // RET: calibrated maximum speed
{
    if(attached()) {
        return min<distance_type>(_leftWheel->maximumSpeed(), _rightWheel->maximumSpeed());
    }
    return 0;
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
 * immediately 
 * - stop the rover and 
 * - disengage speed controller and 
 * - clear command queue
 */
TwoWheelRover& TwoWheelRover::roverHalt()   // RET: this rover
{
    if (!attached())
        return *this;

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
    speed_type speed)       // IN : target speed for wheel
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
    speed_type speed)       // IN : target speed for wheel
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
    speed_type speed)       // IN : target speed for wheel
                            // RET: this TwoWheelRover
{
    return _roverWheelSpeed(_rightWheel, useSpeedControl, forward, speed);
}


/**
 * Poll rover systems
 */
TwoWheelRover& TwoWheelRover::poll(
    unsigned long currentMillis)   // IN : milliseconds since startup
                                   // RET: this rover
{
    if(attached()) {
        _pollPose(currentMillis);
        _pollWheels(currentMillis);
    }
    return *this;
}

/**
 * Poll wheel encoders
 */
TwoWheelRover& TwoWheelRover::_pollWheels(    
    unsigned long currentMillis)   // IN : milliseconds since startup
                                   // RET: this rover
{
    if(nullptr != _leftWheel) {
        _leftWheel->poll(millis());
    }
    if(nullptr != _rightWheel) {
        _rightWheel->poll(millis());
    }

    return *this;
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
 * Get the most recently calcualted pose velocity
 */
Pose2D TwoWheelRover::poseVelocity()   // RET: most recently calculated pose velocity
{
    return _lastPoseVelocity;
}

/**
 * Reset pose estimation back to origin
 */
TwoWheelRover& TwoWheelRover::resetPose()   // RET: this rover
{
    _lastPoseMs = 0;    // will reset on next _pollPose()
    return *this;
}



/**
 * Poll to update the rover pose (x, y, angle)
 */
TwoWheelRover& TwoWheelRover::_pollPose(
    unsigned long currentMillis)   // IN : milliseconds since startup
                                   // RET: this rover
{
    if(attached()) {
        //
        // determine if enough time has gone by to run speed control
        //
        if(0 == _lastPoseMs) {
            // initialize
            _lastPoseMs = currentMillis;
            _lastLeftEncoderCount = readLeftWheelEncoder();   // last encoder count for left wheel
            _lastRightEncoderCount = readRightWheelEncoder();  // last encoder count for right wheel
            _lastLeftDistance = _leftWheel->circumference() * (distance_type)_lastLeftEncoderCount / _leftWheel->countsPerRevolution();;
            _lastRightDistance = _rightWheel->circumference() * (distance_type)_lastRightEncoderCount / _rightWheel->countsPerRevolution();

            //
            // stopped at origin, pointing to zero radians
            //
            _lastPose.x = 0;
            _lastPose.y = 0;
            _lastPose.angle = 0;   // pointing right
            _lastPoseVelocity.x = 0;
            _lastPoseVelocity.y = 0;
            _lastPoseVelocity.angle = 0;

            // publish speed control message
            if(nullptr != _messageBus) {
                publish(*_messageBus, ROVER_POSE, ROVER_SPEC);
            }
        } else if(currentMillis >= (_lastPoseMs + POSE_POLL_MS)) {
            const encoder_count_type leftWheelCount = readLeftWheelEncoder();
            const encoder_count_type rightWheelCount = readRightWheelEncoder();

            //
            // make sure at least one wheel has moves some minimum rotation 
            // so we can reduce noise in the velocity calculation
            //
            if((abs(leftWheelCount - _lastLeftEncoderCount) >= POSE_MIN_ENCODER_COUNT) 
                || (abs(rightWheelCount - _lastRightEncoderCount) >= POSE_MIN_ENCODER_COUNT)) 
            {
                const distance_type currentLeftDistance =  _leftWheel->circumference() * (distance_type)leftWheelCount / _leftWheel->countsPerRevolution();
                const distance_type leftDeltaDistance = currentLeftDistance - _lastLeftDistance;

                const distance_type currentRightDistance =  _rightWheel->circumference() * (distance_type)rightWheelCount / _rightWheel->countsPerRevolution();
                const distance_type rightDeltaDistance = currentRightDistance - _lastRightDistance; 

                // distance and velocity at center of rover
                const distance_type deltaTimeSec = (currentMillis - _lastPoseMs) / 1000.0;
                const distance_type deltaDistance = (rightDeltaDistance + leftDeltaDistance) / 2;
                // const speed_type linearVelocity = deltaDistance / deltaTimeSec;

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
                _lastPoseVelocity.x = (x - _lastPose.x) / deltaTimeSec;
                _lastPoseVelocity.y = (y - _lastPose.y) / deltaTimeSec;
                _lastPoseVelocity.angle = angularVelocity;

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
                _lastLeftEncoderCount = leftWheelCount;
                _lastRightEncoderCount = rightWheelCount;
                _lastLeftDistance = currentLeftDistance;
                _lastRightDistance = currentRightDistance;

                // publish speed control message
                if(nullptr != _messageBus) {
                    publish(*_messageBus, ROVER_POSE, ROVER_SPEC);
                }
            }
        }
    }

    return *this;
}

