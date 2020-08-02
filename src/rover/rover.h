#ifndef ROVER_H
#define ROVER_H

#include <stdint.h>

#ifdef DEBUG
    #include <stdio.h>
    #define LOG(_msg, ...) do{printf(cstr(String(_msg) + "\n"), __VA_ARGS__);}while(0)
#else
    #define LOG(_msg, ...) do{}while(0)
#endif


#define SUCCESS (0)
#define FAILURE (-1)

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

#define MAX_SPEED_COMMAND (255)

extern void roverInit(int a1, int a2, int b1, int b2);
extern int submitTurtleCommand(const char *directionParam, const char *speedParam);
extern int submitTankCommand(const char *command, const int length);

extern void roverHalt();

extern int enqueueRoverCommand(TankCommand command);
extern int dequeueRoverCommand(TankCommand *command);
extern int executeRoverCommand(TankCommand command);

#endif
