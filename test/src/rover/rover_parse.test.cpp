#include <string.h>

#include "../../test.h"
#include "../../../src/rover/rover_parse.h"


void TestParseWheelCommand() {
    // happy path
    String command = "true, 255";
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
    command = "   FALSE    ,    10,  ";
    wheel = parseWheelCommand(command, 0);
    if(!wheel.matched) {
        testError("parseWheelCommand: Failed to parse command: '%s'", cstr(command));
    }
    if((command.find("0") + 1) != wheel.index) {
        testError("parseWheelCommand: index is wrong after parsing: %d != %d", (command.find("0") + 1), wheel.index);
    }
    if((false != wheel.value.forward) 
        || (10 != wheel.value.value)) 
    {
        testError("parseWheelCommand: value is wrong after parsing: false != %s, 10 != %d", tstr(wheel.value.forward), wheel.value.value);
    }

}


void TestParseTankCommand() {
    // happy path
    String command = "tank(true, 255, false, 0)";
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

int main() {
    // from test folder run: 
    // gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/rover/rover_parse.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

    TestParseWheelCommand();
    TestParseTankCommand();

    return testResults("rover_parse");
}
