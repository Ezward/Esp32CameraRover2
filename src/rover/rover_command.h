#ifndef ROVER_COMMAND_H
#define ROVER_COMMAND_H

#include "./rover.h"
#include "./goto_goal.h"

//
// discriminate between commands
//
typedef enum {
    NOOP = 0,
    HALT,
    TANK,
    PID,
    STALL,
    RESET_POSE,
    GOTO,
} CommandType;

extern const char *CommandNames[];

//
// speed/direction command to send to hardware 
// for a single wheel
//
typedef float SpeedValue;
typedef struct SpeedCommand {
    SpeedCommand(): forward(false), value(SpeedValue()) {};
    SpeedCommand(bool f, SpeedValue s): forward(f), value(s) {};

    bool forward;
    SpeedValue value;
} SpeedCommand;

//
// command to set speed control parameters
//
typedef struct PidCommand {
    PidCommand(): wheels(NO_WHEELS), minSpeed(0), maxSpeed(0), Kp(0), Ki(0), Kd(0) {};
    PidCommand(WheelId w, SpeedValue mn, SpeedValue mx, float p, float i, float d): wheels(w), minSpeed(mn), maxSpeed(mx), Kp(p), Ki(i), Kd(d) {};

    WheelId wheels;         // bits designating which wheels this command applies to
    SpeedValue minSpeed;    // minimum measured speed below which motor stalls
    SpeedValue maxSpeed;    // maximum measured speed
    float Kp;               // proportional gain
    float Ki;               // integral gain
    float Kd;               // derivative gain
} PidCommand;

//
// command to set stall values for all motors
//
typedef struct StallCommand {
    StallCommand(): leftStall(0), rightStall(0) {};
    StallCommand(float l, float r): leftStall(l), rightStall(r) {};

    float leftStall;    // 0 to 1 fraction of max pwn
    float rightStall;   // 0 to 1 fraction of max pwm
} StallCommand;

//
// command to change speed and direction 
// for both wheels
//
typedef struct TankCommand {
    TankCommand(): useSpeedControl(false), left(false, 0), right(false, 0) {};
    TankCommand(bool u, SpeedCommand l, SpeedCommand r): useSpeedControl(u), left(l), right(r) {};

    bool useSpeedControl;    // true to call setSpeed(), false to call setPower()
    SpeedCommand left;
    SpeedCommand right;
} TankCommand;

//
// command to move rover to a given location
//
typedef struct GotoCommand {
    GotoCommand(): x(0), y(), tolerance(0), pointForward(0) {};
    GotoCommand(distance_type _x, distance_type _y, distance_type _tolerance, distance_type _pointForward)
        : x(_x), y(_y), tolerance(_tolerance), pointForward(_pointForward) 
    {};

    distance_type x;
    distance_type y;
    distance_type tolerance;
    distance_type pointForward;
} GotoCommand;

typedef struct RoverCommand {
    RoverCommand(): type(NOOP), tank(TankCommand()) {};
    RoverCommand(CommandType t): type(t), tank(TankCommand()) {};
    RoverCommand(CommandType t, TankCommand c): type(t), tank(c) {};
    RoverCommand(CommandType t, PidCommand c): type(t), pid(c) {};
    RoverCommand(CommandType t, StallCommand c): type(t), stall(c) {};
    RoverCommand(CommandType t, GotoCommand c): type(t), go2(c) {};

    CommandType type;    // if matched, the command number OR NOOP
    union  {
        TankCommand tank; 
        PidCommand pid;    
        StallCommand stall;
        GotoCommand go2;
    };
} RoverCommand;

typedef struct SubmitCommandResult {
    int status;
    int id;
    RoverCommand command;
} SubmitCommandResult;


#define MAX_SPEED_COMMAND (255)

#define COMMAND_BAD_FAILURE (-1)
#define COMMAND_PARSE_FAILURE (-2)
#define COMMAND_ENQUEUE_FAILURE (-3)


class RoverCommandProcessor {
    private:
    static const unsigned int COMMAND_BUFFER_SIZE = 4;
    TankCommand _commandQueue[COMMAND_BUFFER_SIZE];     // circular queue of commands
    uint8_t _commandHead = 0; // read from head
    uint8_t _commandTail = 0; // append to tail

    TwoWheelRover* _rover = nullptr;
    GotoGoalBehavior* _gotoGoalBehavior = nullptr;

    public:

    /**
     * Determine if rover's dependencies are attached
     */
    bool attached();

    /**
     * Attach rover dependencies
     */
    RoverCommandProcessor& attach(
        TwoWheelRover &rover,               // IN : rover attached state
        GotoGoalBehavior &gotoGoalBehavior);// IN : behavior in attached state
                                            // RET: this RoverCommandProcessor in attached state

    /**
     * Detach dependencies
     */
    RoverCommandProcessor& detach(); // RET: this behavior in detached state

    /**
     * Add a command, as string parameters, to the command queue
     */
    int submitTurtleCommand(
        boolean useSpeedControl,    // IN : true if command is a speed command
                                    //      false if command is a pwm command
        const char *directionParam, // IN : direction as a string; "forward",
                                    //      "reverse", "left", "right", or "stop"
        const char *speedParam);    // IN : speed as an numeric string
                                    //      - if useSpeedControl is true, speed >= 0
                                    //      - if useSpeedControl is false, 0 >= speed >= 255
                                    // RET: 0 for SUCCESS, non-zero for error code


    /*
    ** submit the tank command that was
    ** send in the websocket channel
    */
    SubmitCommandResult submitCommand(
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
     * Poll command queue
     */
    RoverCommandProcessor& pollRoverCommand(
        unsigned long currentMillis);  // IN : milliseconds since startup
                                       // RET: this rover

};

#endif // ROVER_COMMAND_H