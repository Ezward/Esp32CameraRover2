#ifndef ROVER_PARSE_H
#define ROVER_PARSE_H

#include "rover.h"
#include "../parse/scan.h"

typedef struct _ParseWheelResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    SpeedCommand value; // if matched, the wheel command
                        // otherwise {true, 0}
} ParseWheelResult;


typedef struct _ParseTankResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    TankCommand value;  // if matched, the tank command, else {{true, 0}, {true, 0}}
} ParseTankResult;


typedef struct _ParseCommandResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    int id;             // unique id for this command instance
    TankCommand tank;  // if matched, the tank command, else {{true, 0}, {true, 0}}
} ParseCommandResult;


extern ParseWheelResult parseWheelCommand(String command, const int offset);
extern ParseTankResult parseTankCommand(String command, const int offset);
extern ParseCommandResult parseCommand(String command, const int offset);

#endif