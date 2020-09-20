#ifndef ROVER_H
#define ROVER_H

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

extern void roverInit(int a1, int a2, int b1, int b2);
extern int submitTurtleCommand(const char *directionParam, const char *speedParam);
extern SubmitTankCommandResult submitTankCommand(const char *commandParam, const int offset);

extern void roverHalt();

extern int enqueueRoverCommand(TankCommand command);
extern int dequeueRoverCommand(TankCommand *command);
extern int executeRoverCommand(TankCommand command);

#endif
