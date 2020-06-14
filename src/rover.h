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

extern void roverInit(int a1, int a2, int b1, int b2);
extern int submitRoverCommand(const char *directionParam, const char *speedParam);

extern int enqueueRoverCommand(uint8_t directionCommand, uint8_t speedCommand);
extern int dequeueRoverCommand(uint8_t *directionCommand, uint8_t *speedCommand);
extern int executeRoverCommand(uint8_t directionCommand, uint8_t speedCommand);


#endif
