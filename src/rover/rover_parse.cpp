#ifndef TESTING
    #include <Arduino.h>
#endif

#include "rover.h"
#include "rover_parse.h"

/*
** parse speed,forward pair like '128, true'
*/
ParseWheelResult parseWheelCommand(
    String command,     // IN : the string to scan
    const int offset)   // IN : the index into the string to start scanning
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
    ScanResult scan = scanChars(command, offset, ' '); // skip whitespace
    ParseIntegerResult scanInt = parseUnsignedInt(command, scan.index);
    if(scanInt.matched) {
        scan = scanChars(command, scanInt.index, ' '); // skip whitespace
        scan = scanChar(command, scan.index, ',');
        if(scan.matched) {
            scan = scanChars(command, scan.index, ' '); // skip whitespace
            ParseBooleanResult scanBool = parseBoolean(command, scan.index);
            if(scanBool.matched) {
                LOGFMT("wheel parsed: \"%s\"", cstr(command.substr(offset, scanBool.index - offset)));
                return {true, scanBool.index, scanBool.value, (SpeedValue)scanInt.value};
            }
        }
    }
    LOGFMT("wheel parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, true, 0};
}

/*
** parse a full tank command like
**   tank(128, true, 64, false)
*/
ParseTankResult parseTankCommand(
    String command,     // IN : the string to scan
    const int offset)   // IN : the index into the string to start scanning
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
    // scan command open
    ScanResult scan = scanChars(command, offset, ' '); // skip whitespace
    scan = scanString(command, scan.index, String("tank("));
    if(scan.matched) {
        // scan left wheel command
        ParseWheelResult left = parseWheelCommand(command, scan.index);
        if(left.matched) {
            // scan command between commands
            scan = scanChars(command, left.index, ' '); // skip whitespace
            scan = scanChar(command, scan.index, ',');
            if(scan.matched) {
                // scan right wheel command
                ParseWheelResult right = parseWheelCommand(command, scan.index);
                if(right.matched) {
                    // Scan command close
                    scan = scanChars(command, right.index, ' '); // skip whitespace
                    scan = scanChar(command, scan.index, ')');
                    if(scan.matched) {
                        LOGFMT("tank parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
                        return {true, scan.index, {left.value, right.value}};
                    }
                }
            }
        }
    }
    LOGFMT("tank parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, {{true, 0}, {true, 0}}};
}

ParseCommandResult parseCommand(
    String command,     // IN : the string to scan
    const int offset)   // IN : the index into the string to start scanning
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
    // scan command open
    ScanResult scan = scanChars(command, 0, ' '); // skip whitespace
    scan = scanString(command, scan.index, String("cmd("));
    if(scan.matched) {
        // scan left wheel command
        scan = scanChars(command, scan.index, ' '); // skip whitespace
        ParseIntegerResult id = parseUnsignedInt(command, scan.index);
        if(id.matched) {
            // scan command between commands
            scan = scanChars(command, id.index, ' '); // skip whitespace
            scan = scanChar(command, scan.index, ',');
            if(scan.matched) {
                // scan right wheel command
                ParseTankResult tank = parseTankCommand(command, scan.index);
                if(tank.matched) {
                    // Scan command close
                    scan = scanChars(command, tank.index, ' '); // skip whitespace
                    scan = scanChar(command, scan.index, ')');
                    if(scan.matched) {
                        LOGFMT("command parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
                        return {true, scan.index, id.value, tank.value};
                    }
                }
            }
        }
    }
    LOGFMT("tank parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, 0, {{true, 0}, {true, 0}}};
}
