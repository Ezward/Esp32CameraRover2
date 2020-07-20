#ifndef ROVER_H
#define ROVER_H

#define SUCCESS (0)
#define FAILURE (-1)

typedef enum {
    ROVER_STOP,
    ROVER_FORWARD,
    ROVER_RIGHT,
    ROVER_LEFT,
    ROVER_REVERSE,
    DIRECTION_COUNT
} DirectionCommand;

//
// speed command to send to hardware
//
typedef uint8_t SpeedCommand;
#define MAX_SPEED_COMMAND (255)

extern void roverInit(int a1, int a2, int b1, int b2);
extern int submitRoverCommand(const char *directionParam, const char *speedParam);

extern int enqueueRoverCommand(uint8_t directionCommand, SpeedCommand speedCommand);
extern int dequeueRoverCommand(uint8_t *directionCommand, SpeedCommand *speedCommand);
extern int executeRoverCommand(uint8_t directionCommand, SpeedCommand speedCommand);

#endif
