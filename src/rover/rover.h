#ifndef ROVER_H
#define ROVER_H

#include "../wheel/drive_wheel.h"
#include "./pose.h"

#include <stdint.h>

#ifdef DEBUG
    #include <stdio.h>
    #define LOG(_msg) do{printf(String(_msg).c_str());}while(0)
    #define LOGFMT(_msg, ...) do{printf((String(_msg) + String("\n")).c_str(), __VA_ARGS__);}while(0)
#else
    #define LOG(_msg) do{}while(0)
    #define LOGFMT(_msg, ...) do{}while(0)
#endif

#ifndef SUCCESS
    #define SUCCESS (0)
    #define FAILURE (-1)
#endif

// bit flags to designate wheels
typedef unsigned short WheelId;
const WheelId LEFT_WHEEL = 0x01;
const WheelId RIGHT_WHEEL = 0x02;
const WheelId ALL_WHEELS = LEFT_WHEEL | RIGHT_WHEEL;
const WheelId NO_WHEELS = 0x00;


class TwoWheelRover : public Publisher  {
    private:

    // attached dependencies
    DriveWheel *_leftWheel = nullptr;
    DriveWheel *_rightWheel = nullptr;
    distance_type _wheelBase;
    MessageBus *_messageBus = nullptr;

    pwm_type _speedLeft = 0;
    pwm_type _speedRight = 0;
    pwm_type _forwardLeft = 1;
    pwm_type _forwardRight = 1;

    unsigned long _lastPoseMs = 0;         // last time we polled for pose
    encoder_count_type _lastLeftEncoderCount = 0;   // last encoder count for left wheel
    encoder_count_type _lastRightEncoderCount = 0;  // last encoder count for right wheel
    distance_type _lastLeftDistance = 0;   // last calculated distance for left wheel
    distance_type _lastRightDistance = 0;  // last calculated distance for right wheel
    Pose2D _lastPose = {0, 0, 0};          // most recently polled position/orientation
    Pose2D _lastPoseVelocity = {0, 0, 0};      // most recently polled velocities

    /**
     * Poll command queue 
     */
    TwoWheelRover& _pollRoverCommand(unsigned long currentMillis);  // IN : milliseconds since startup
                                                                    // RET: this rover

   /**
     * Poll rover wheel encoders
     */
    TwoWheelRover& _pollWheels(unsigned long currentMillis);    // IN : milliseconds since startup
                                                                // RET: this rover

    /**
     * Poll to update the rover pose (x, y, angle)
     */
    TwoWheelRover& _pollPose(unsigned long currentMillis);  // IN : milliseconds since startup
                                                            // RET: this rover

    /**
     * send speed and direction to one or more wheels
     */
    TwoWheelRover& _roverWheelSpeed(
        DriveWheel* wheel,      // IN : the wheel to control
        bool useSpeedControl,   // IN : true to call setSpeed() and enable speed controller
                                //      false to call setPower() and disable speed controller
        bool forward,           // IN : true to move wheel in forward direction
                                //      false to move wheel in reverse direction
        speed_type speed);   // IN : target speed for wheel
                                // RET: this TwoWheelRover

    public:

    TwoWheelRover(        
        distance_type wheelBase) // IN : distance between drive wheels
        :  Publisher(ROVER_SPEC), _wheelBase(wheelBase)
    {
    }

    ~TwoWheelRover() {
        detach();
    }

    /**
     * Deteremine if rover's dependencies are attached
     */
    bool attached();

    /**
     * Attach rover dependencies
     */
    TwoWheelRover& attach(
        DriveWheel &leftWheel,   // IN : left drive wheel in attached state
        DriveWheel &rightWheel,  // IN : right drive wheel in attached state
        MessageBus *messageBus); // IN : pointer to MessageBus to publish state changes
                                 //      or NULL to not publish state changes
                                 // RET: this rover in attached state

    /**
     * Detach rover dependencies
     */
    TwoWheelRover& detach(); // RET: this rover in detached state

    /**
     * Distance between drive wheels
     */
    distance_type wheelBase(); // RET: distance between drive wheels

    /**
     * Reset pose estimation back to origin
     */
    TwoWheelRover& resetPose();   // RET: this rover

    /**
     * Set speed control parameters
     */
    TwoWheelRover& setSpeedControl(
        WheelId wheels,         // IN : bit flags for wheels to apply 
        speed_type minSpeed,    // IN : minimum speed of motor below which it stalls
        speed_type maxSpeed,    // IN : maximum speed of motor
        float Kp,               // IN : proportional gain
        float Ki,               // IN : integral gain
        float Kd);              // IN : derivative gain
                                // RET: this TwoWheelRover

    /**
     * Set motor stall values
     */
    TwoWheelRover& setMotorStall(
        float left,  // IN : (0 to 1.0) fraction of full pwm 
                     //      at which left motor stalls
        float right);// IN : (0 to 1.0) fraction of full pwm 
                     //      at which right motor stalls
                     // RET: this TwoWheelRover

    /**
     * Get calibrated minimum forward speed for rover
     */
    speed_type minimumSpeed(); // RET: calibrated minimum speed

    /**
     * Get calibrated maximum forward speed for rover
     */
    speed_type maximumSpeed(); // RET: calibrated maximum speed

    /**
     * Read value of left wheel encoder
     */
    encoder_count_type readLeftWheelEncoder(); // RET: wheel encoder count

    /**
     * Read value of right wheel encoder
     */
    encoder_count_type readRightWheelEncoder(); // RET: wheel encoder count

    /**
     * Poll rover systems
     */
    TwoWheelRover& poll(unsigned long currentMillis);   // IN : milliseconds since startup
                                                        // RET: this rover

    /**
     * Get the last poll time in ms from startup
     */
    unsigned long lastPoseMs();   // RET: time of last poll in ms

    /**
     * Get the most recently calcualted pose
     */
    Pose2D pose();   // RET: most recently calculated pose

    /**
     * Get the most recently calcualted pose velocity
     */
    Pose2D poseVelocity();   // RET: most recently calculated pose velocity


    /**
     * Immediately 
     * - stop the rover  
     * - disengage speed controller  
     * - clear command queue
     */
    TwoWheelRover& roverHalt();   // RET: this rover


    /**
     * send speed and direction to left wheel
     */
    TwoWheelRover& roverLeftWheel(
        bool useSpeedControl,   // IN : true to call setSpeed() and enable speed controller
                                //      false to call setPower() and disable speed controller
        bool forward,           // IN : true to move wheel in forward direction
                                //      false to move wheel in reverse direction
        speed_type speed);      // IN : target speed for wheel
                                // RET: this TwoWheelRover


    /**
     * send speed and direction to right wheel
     */
    TwoWheelRover& roverRightWheel(
    bool useSpeedControl,   // IN : true to call setSpeed() and enable speed controller
                            //      false to call setPower() and disable speed controller
    bool forward,           // IN : true to move wheel in forward direction
                            //      false to move wheel in reverse direction
    speed_type speed);      // IN : target speed for wheel
                            // RET: this TwoWheelRover

    private: 
    /**
     * Log the current value of the wheel encoders
     */
    void logWheelEncoders(EncoderLogger logger) {
        #ifdef LOG_MESSAGE
        #ifdef LOG_LEVEL
            #if (LOG_LEVEL >= DEBUG_LEVEL)
                if(NULL != _leftEncoder) {
                    unsigned int thisLeftCount = readLeftWheelEncoder();
                    if(thisLeftCount != _lastLeftCount) {
                        logger("Left Wheel:  ", thisLeftCount);
                        _lastLeftCount = thisLeftCount;
                    }
                }
                if(NULL != _rightEncoder) {
                    unsigned int thisRightCount = readRightWheelEncoder();
                    if(thisRightCount != _lastRightCount) {
                        logger("Right Wheel:  ", thisRightCount);
                        _lastRightCount = thisRightCount;
                    }
                }
            #endif
        #endif
        #endif
    }

};

#endif
