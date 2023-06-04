#ifndef ROVER_PARSE_H
#define ROVER_PARSE_H

#include "./rover_command.h"
#include "./rover_parse.h"
#include "../../common/parse/scan.h"

typedef struct ParseWheelResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    SpeedCommand value; // if matched, the wheel command
                        // otherwise {false, 0}
} ParseWheelResult;


typedef struct ParseTankResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    TankCommand value;  // if matched, the tank command, else {{false, 0}, {false, 0}}
} ParseTankResult;


typedef struct ParsePidResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    PidCommand value;   // if matched, the pid command, else {0, 0, 0, 0}
} ParsePidResult;

typedef struct ParseStallResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    StallCommand value;   // if matched, the stall command, else {0,0}
} ParseStallResult;

typedef struct ParseGotoResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    GotoCommand value;   // if matched, the stall command, else {0,0}
} ParseGotoResult;

typedef struct ParseCommandResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    int id;             // unique id for this command instance
    RoverCommand command;
} ParseCommandResult;

typedef struct ParseNoArgCommandResult {
    bool matched;       // true if fully matched, false if not
    int index;          // if matched, index of first char after matched span,
                        // otherwise index of start of scan
    CommandType value;  // if matched, the command
} ParseNoArgCommandResult;

extern ParseWheelResult parseWheelCommand(String command, const int offset);
extern ParseTankResult parseTankCommand(String command, const int offset);
extern ParseCommandResult parseCommand(String command, const int offset);

#endif