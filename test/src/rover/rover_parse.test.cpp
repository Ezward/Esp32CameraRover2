#include <string.h>

#include "../../test.h"
#include "../../../src/rover/rover_parse.h"


void TestParseWheelCommand() {
    // happy path
    String command = "255, true";
    ParseWheelResult wheel = parseWheelCommand(command, 0);
    if(!wheel.matched) {
        testError("parseWheelCommand: Failed to parse command: '%s'", cstr(command));
    }
    if(len(command) != wheel.index) {
        testError("parseWheelCommand: index is wrong after parsing: %d != %d", len(command), wheel.index);
    }
    if((true != wheel.value.forward) 
        || (255 != wheel.value.value))
    {
        testError("parseWheelCommand: value is wrong after parsing: true != %s, 255 != %d", tstr(wheel.value.forward), wheel.value.value);
    }

    //
    // should skip spaces betwee fields and ignore trailing characters
    //
    command = "   10    ,    FALSE,  ";
    wheel = parseWheelCommand(command, 0);
    if(!wheel.matched) {
        testError("parseWheelCommand: Failed to parse command: '%s'", cstr(command));
    }
    if((command.find("E") + 1) != wheel.index) {
        testError("parseWheelCommand: index is wrong after parsing: %d != %d", (command.find("E") + 1), wheel.index);
    }
    if((false != wheel.value.forward) 
        || (10 != wheel.value.value)) 
    {
        testError("parseWheelCommand: value is wrong after parsing: false != %s, 10 != %d", tstr(wheel.value.forward), wheel.value.value);
    }

}


void TestParseTankCommand() {
    // happy path
    String command = "tank(255, true, 0, false)";
    ParseTankResult tank = parseTankCommand(command, 0);
    if(!tank.matched) {
        testError("parseTankCommand: Failed to parse command: '%s'", cstr(command));
    }
    if(len(command) != tank.index) {
        testError("parseTankCommand: index is wrong after parsing: %d != %d", len(command), tank.index);
    }
    if((true != tank.value.left.forward) 
        || (255 != tank.value.left.value)
        || (false != tank.value.right.forward)
        || (0 != tank.value.right.value)) 
    {
        testError("parseTankCommand: value is wrong after parsing", "");
    }
}

void TestParseCommand() {
    // happy path
    String command = "cmd(123, tank(255, true, 0, false))";
    ParseCommandResult cmd = parseCommand(command, 0);
    if(!cmd.matched) {
        testError("parseTankCommand: Failed to parse command: '%s'", cstr(command));
    }
    if(len(command) != cmd.index) {
        testError("parseTankCommand: index is wrong after parsing: %d != %d", len(command), cmd.index);
    }
    if( (123 != cmd.id)
        || (true != cmd.tank.left.forward) 
        || (255 != cmd.tank.left.value)
        || (false != cmd.tank.right.forward)
        || (0 != cmd.tank.right.value)) 
    {
        testError("parseTankCommand: value is wrong after parsing", "");
    }

    command = "cmd(0, tank(0, true, 0, true))";
    cmd = parseCommand(command, 0);
    if(!cmd.matched) {
        testError("parseTankCommand: Failed to parse command: '%s'", cstr(command));
    }
    if(len(command) != cmd.index) {
        testError("parseTankCommand: index is wrong after parsing: %d != %d", len(command), cmd.index);
    }
    if( (0 != cmd.id)
        || (true != cmd.tank.left.forward) 
        || (0 != cmd.tank.left.value)
        || (true != cmd.tank.right.forward)
        || (0 != cmd.tank.right.value)) 
    {
        testError("parseTankCommand: value is wrong after parsing", "");
    }

}

int main() {
    // from test folder run: 
    // gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/rover/rover_parse.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

    TestParseWheelCommand();
    TestParseTankCommand();

    return testResults("rover_parse");
}
