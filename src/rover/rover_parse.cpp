#include "rover.h"
#include "rover_parse.h"

/*
** parse forward,speed pair
*/
ParseWheelResult parseWheelCommand(
    String command, // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
    ScanResult scan = scanChars(command, offset, ' '); // skip whitespace
    ParseBooleanResult scanBool = parseBoolean(command, scan.index);
    if(scanBool.matched) {
        scan = scanChars(command, scanBool.index, ' '); // skip whitespace
        scan = scanChar(command, scan.index, ',');
        if(scan.matched) {
            scan = scanChars(command, scan.index, ' '); // skip whitespace
            ParseIntegerResult scanInt = parseUnsignedInt(command, scan.index);
            if(scanInt.matched) {
                LOG("wheel parsed: \"%s\"", cstr(command.substr(offset, scanInt.index - offset)));
                return {true, scanInt.index, scanBool.value, (SpeedValue)scanInt.value};
            }
        }
    }
    LOG("wheel parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, true, 0};
}

/*
** parse a full tank command like
**   tank(true, 128, false, 255)
*/
ParseTankResult parseTankCommand(
    String command, // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
    // scan command open
    ScanResult scan = scanChars(command, 0, ' '); // skip whitespace
    scan = scanString(command, scan.index, "tank(");
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
                    ScanResult scan = scanChars(command, right.index, ' '); // skip whitespace
                    scan = scanChar(command, scan.index, ')');
                    if(scan.matched) {
                        LOG("tank parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
                        return {true, scan.index, {left.value, right.value}};
                    }
                }
            }
        }
    }
    LOG("tank parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, {{true, 0}, {true, 0}}};
}
