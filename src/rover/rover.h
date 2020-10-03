#ifndef ROVER_H
#define ROVER_H

#include "../motor/motor_l9110s.h"
#include "../encoder/encoder.h"

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

typedef uint8_t SpeedValue;

//
// speed/direction command to send to hardware 
// for a single wheel
//
typedef struct _SpeedCommand {
    bool forward;
    SpeedValue value;
} SpeedCommand;

//
// command to change speed and direction 
// for both wheels
//
typedef struct _TankCommand {
    SpeedCommand left;
    SpeedCommand right;
} TankCommand;

typedef struct _SubmitTankCommandResult {
    int status;
    int id;
    TankCommand tank;
} SubmitTankCommandResult;

#define MAX_SPEED_COMMAND (255)

#define COMMAND_BAD_FAILURE (-1)
#define COMMAND_PARSE_FAILURE (-2)
#define COMMAND_ENQUEUE_FAILURE (-3)


class TwoWheelRover {
    private:

    pwm_type _speedLeft = 0;
    pwm_type _speedRight = 0;
    pwm_type _forwardLeft = 1;
    pwm_type _forwardRight = 1;

    static const unsigned int COMMAND_BUFFER_SIZE = 16;
    TankCommand _commandQueue[COMMAND_BUFFER_SIZE];     // circular queue of commands
    uint8_t _commandHead = 0; // read from head
    uint8_t _commandTail = 0; // append to tail

    MotorL9110s *_leftMotor = NULL;
    MotorL9110s *_rightMotor = NULL;

    Encoder *_leftEncoder = NULL;
    Encoder *_rightEncoder = NULL;
    unsigned int _lastLeftCount = 0;
    unsigned int _lastRightCount = 0;

    /**
     * Poll command queue 
     */
    TwoWheelRover& _pollRoverCommand(); // RET: this rover

   /**
     * Poll rover wheel encoders
     */
    TwoWheelRover& _pollWheelEncoders();   // RET: this rover

    public:

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
        MotorL9110s &leftMotor, // IN : left wheel's motor
        MotorL9110s &rightMotor,// IN : right wheel's motor
        Encoder *leftEncoder,   // IN : point to left wheel encoder
                                //      or NULL if encoder not used
        Encoder *rightEncoder); // IN : pointer to right wheel encoder
                                //      or NULL if encoder not used
                                // RET: this rover in attached state

    /**
     * Detach rover dependencies
     */
    TwoWheelRover& detach(); // RET: this rover in detached state

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
    TwoWheelRover& poll();   // RET: this rover

    /**
     * Add a command, as string parameters, to the command queue
     */
    int submitTurtleCommand(
        const char *directionParam, // IN : direction as a string; "forward",
                                    //      "reverse", "left", "right", or "stop"
        const char *speedParam);    // IN : speed as an integer string, "0".."255"
                                    //      where "0" is stop,  "255" is full speed
                                    // RET: 0 for SUCCESS, non-zero for error code


    /*
    ** submit the tank command that was
    ** send in the websocket channel
    */
    SubmitTankCommandResult submitTankCommand(
        const char *commandParam,   // IN : A wrapped tank command link cmd(tank(...))
        const int offset);          // IN : offset of cmd() wrapper in command buffer
                                    // RET: struct with status, command id and command
                                    //      where status == SUCCESS or
                                    //      status == -1 on bad command (null or empty)
                                    //      status == -2 on parse error
                                    //      status == -3 on enqueue error (queue is full)


    /**
     * Append a command to the command queue.
     */
    int enqueueRoverCommand(
        TankCommand command);   // IN : speed/direction for both wheels
                                // RET: SUCCESS if command could be queued
                                //      FAILURE if buffer is full.


    /**
     * Get the next command from the command queue.
     */
    int dequeueRoverCommand(
        TankCommand *command);  // OUT: on SUCCESS, speed/direction for both wheels
                                //      otherwise unchanged.
                                // RET: SUCCESS if buffer had a command to return 
                                //      FAILURE if buffer is empty.


    /**
     * Execute the given rover command
     */
    int executeRoverCommand(
        TankCommand &command);  // IN : speed/direction for both wheels
                                // RET: SUCCESS if command executed
                                //      FAILURE if command could not execute


    /**
     * immediately stop the rover and clear command queue
     */
    void roverHalt();

    private: 

    /**
     * send speed and direction to left wheel
     */
    void roverLeftWheel(
        bool forward,       // IN : true to move wheel in forward direction
                            //      false to move wheel in reverse direction
        SpeedValue speed);  // IN : target speed for wheel


    /**
     * send speed and direction to right wheel
     */
    void roverRightWheel(
        bool forward,       // IN : true to move wheel in forward direction
                            //      false to move wheel in reverse direction
        SpeedValue speed);  // IN : target speed for wheel

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
