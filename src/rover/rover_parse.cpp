#ifndef TESTING
    #include <Arduino.h>
#endif

#include "rover.h"
#include "rover_parse.h"

/**
 * Scan delimiter and whitespace around it
 */
ScanResult scanFieldSeparator(String msg, int offset, char delimiter) {
    ScanResult scan = scanChars(msg, offset, ' '); // skip whitespace
    scan = scanChar(msg, scan.index, delimiter);  // skip field separator
    if(scan.matched) {
        scan = scanChars(msg, scan.index, ' '); // skip whitespace
    }
    return scan;
}

ScanResult scanEndCommand(String msg, int offset, char terminator) {
    ScanResult scan = scanChars(msg, offset, ' '); // skip whitespace
    return scanChar(msg, scan.index, terminator);  // skip field separator
}


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
    ParseDecimalResult scanFloat = parseUnsignedFloat(command, scan.index);
    if(scanFloat.matched) {
        scan = scanFieldSeparator(command, scanFloat.index, ',');
        if(scan.matched) {
            ParseBooleanResult scanBool = parseBoolean(command, scan.index);
            if(scanBool.matched) {
                LOGFMT("wheel parsed: \"%s\"", cstr(command.substr(offset, scanBool.index - offset)));
                return {true, scanBool.index, SpeedCommand(scanBool.value, (SpeedValue)scanFloat.value)};
            }
        }
    }
    LOGFMT("wheel parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, SpeedCommand(false, 0)};
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
    //
    // scan command open
    // - if it is pwm, then we are not using speed control
    // - if it is speed, then we are using speed control
    //
    bool useSpeedControl = false;
    ScanResult scan = scanChars(command, offset, ' '); // skip whitespace
    scan = scanString(command, scan.index, String("pwm("));
    if(!scan.matched) {
        scan = scanString(command, scan.index, String("speed("));
        if(scan.matched) {
            useSpeedControl = true;
        }
    }
    if(scan.matched) {
        // scan left wheel command
        ParseWheelResult left = parseWheelCommand(command, scan.index);
        if(left.matched) {
            // scan command between commands
            scan = scanFieldSeparator(command, left.index, ','); // skip whitespace
            if(scan.matched) {
                // scan right wheel command
                ParseWheelResult right = parseWheelCommand(command, scan.index);
                if(right.matched) {
                    // Scan command close
                    scan = scanEndCommand(command, right.index, ')'); // skip whitespace
                    if(scan.matched) {
                        LOGFMT("wheel parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
                        return {true, scan.index, TankCommand(useSpeedControl, left.value, right.value)};
                    }
                }
            }
        }
    }
    LOGFMT("tank parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, TankCommand()};
}


ParsePidResult parsePidCommand(    String command,     // IN : the string to scan
    const int offset)   // IN : the index into the string to start scanning
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
    //
    // scan command open
    // - if it is pwm, then we are not using speed control
    // - if it is speed, then we are using speed control
    //
    ScanResult scan = scanChars(command, offset, ' '); // skip whitespace
    scan = scanString(command, scan.index, String("pid("));
    if(scan.matched) {
        // scan max speed
        ParseDecimalResult minSpeed = parseUnsignedFloat(command, scan.index);
        if(minSpeed.matched) {
            scan = scanFieldSeparator(command, minSpeed.index, ',');  // skip field separator
            // scan max speed
            ParseDecimalResult maxSpeed = parseUnsignedFloat(command, scan.index);
            if(maxSpeed.matched) {
                scan = scanFieldSeparator(command, maxSpeed.index, ',');  // skip field separator
                if(scan.matched) {
                    ParseDecimalResult Kp = parseUnsignedFloat(command, scan.index);
                    if(Kp.matched) {
                        scan = scanFieldSeparator(command, Kp.index, ',');  // skip field separator
                        if(scan.matched) {
                            ParseDecimalResult Ki = parseUnsignedFloat(command, scan.index);
                            if(Ki.matched) {
                                scan = scanFieldSeparator(command, Ki.index, ',');  // skip field separator
                                if(scan.matched) {
                                    ParseDecimalResult Kd = parseUnsignedFloat(command, scan.index);
                                    if(Kd.matched) {
                                        scan = scanEndCommand(command, Kd.index, ')');
                                        if(scan.matched) {
                                            return {true, scan.index, PidCommand(minSpeed.value, maxSpeed.value, Kp.value, Ki.value, Kd.value)};
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // did not parse
    return {false, offset, PidCommand()};
}

ParseStallResult parseStallCommand(    
    String command,     // IN : the string to scan
    const int offset)   // IN : the index into the string to start scanning
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
    //
    // scan command open
    //
    ScanResult scan = scanChars(command, offset, ' '); // skip whitespace
    scan = scanString(command, scan.index, String("stall("));
    if(scan.matched) {
        // scan motor one stall pwm
        ParseDecimalResult motorOne = parseUnsignedFloat(command, scan.index);
        if(motorOne.matched) {
            scan = scanFieldSeparator(command, motorOne.index, ',');  // skip field separator
            if(scan.matched) {
                // scan motor two stall pwm
                ParseDecimalResult motorTwo = parseUnsignedFloat(command, scan.index);
                if(motorTwo.matched) {
                    scan = scanEndCommand(command, motorTwo.index, ')');
                    if(scan.matched) {
                        return {true, scan.index, StallCommand(motorOne.value, motorTwo.value)};
                    }
                }
            }
        }
    }

    // did not parse
    return {false, offset, StallCommand()};
}

/*
** parse a halt command like: halt()
*/
ParseTankResult parseHaltCommand(
    String command,     // IN : the string to scan
    const int offset)   // IN : the index into the string to start scanning
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
    //
    // halt is special case of tank with zero speed
    //
    ScanResult scan = scanChars(command, offset, ' '); // skip whitespace
    scan = scanString(command, scan.index, String("halt("));
    if(scan.matched) {
        scan = scanEndCommand(command, scan.index, ')'); // skip whitespace
        if(scan.matched) {
            LOGFMT("halt parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
            return {true, scan.index, TankCommand()};   // return a tank command that stops
        }
    }
    LOGFMT("tank parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, TankCommand()};
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
            scan = scanFieldSeparator(command, id.index, ',');
            if(scan.matched) {
                ParsePidResult pid = parsePidCommand(command, scan.index);
                if(pid.matched) {
                    // Scan command close
                    ScanResult scan = scanEndCommand(command, pid.index, ')');
                    if(scan.matched) {
                        LOGFMT("command parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
                        return {true, scan.index, id.value, RoverCommand(PID, pid.value)};
                    }
                } else {
                    ParseTankResult tank = parseTankCommand(command, scan.index);
                    if(tank.matched) {
                        // Scan command close
                        ScanResult scan = scanEndCommand(command, tank.index, ')'); // skip whitespace
                        if(scan.matched) {
                            LOGFMT("command parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
                            return {true, scan.index, id.value, RoverCommand(TANK, tank.value)};
                        }
                    } else {
                        // halt is a special version of tank command that stops motors
                        ParseTankResult halt = parseHaltCommand(command, scan.index);
                        if(halt.matched) {
                            // Scan command close
                            ScanResult scan = scanEndCommand(command, halt.index, ')'); // skip whitespace
                            if(scan.matched) {
                                LOGFMT("command parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
                                return {true, scan.index, id.value, RoverCommand(HALT, halt.value)};
                            }
                        } else {
                            ParseStallResult stall = parseStallCommand(command, scan.index);
                            if(stall.matched) {
                                // Scan command close
                                ScanResult scan = scanEndCommand(command, stall.index, ')'); // skip whitespace
                                if(scan.matched) {
                                    LOGFMT("command parsed: \"%s\"", cstr(command.substr(offset, scan.index - offset)));
                                    return {true, scan.index, id.value, RoverCommand(STALL, stall.value)};
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    LOGFMT("tank parse failed: \"%s\"", cstr(command.substr(offset, len(command) - offset)));
    return {false, offset, 0, RoverCommand()};
}
