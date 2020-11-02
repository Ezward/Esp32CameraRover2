#include <string.h>

#include "../../test.h"
#include "../../../src/pid/step_control.h"

using namespace std;

void TestUpdateForward() {
    StepController controller;
    float output = 0;
    float input = 0;
    unsigned long ms = controller.pollMs();

    controller.setInputRange(-56.0, 56.0);
    controller.setInputTarget(40.0);
    controller.setOutputRange(-255, 255);
    controller.setOutputStep(1);
    controller.setOutputStall(24);
    if(controller.update(input, output, ms)) {
        // from a stop, output should jump to stall
        output = controller.output();
        if(output != controller.outputStall()) {
            testError("TestUpdateForward Controller did not jump to stall from a stop, %f != %f", controller.outputStall(), output);
        }
        input += 1;
    }

    for(int i = 1; input != controller.inputTarget(); i += 1) {
        ms += controller.pollMs();
        if(controller.update(input, controller.output(), ms)) {
            // from a stop, output should jump to stall
            output = controller.output();
            if(output != controller.outputStall() + controller.outputStep() * i) {
                testError("TestUpdateForward Controller did not increment output, %f != %f", 
                    controller.outputStall() + controller.outputStep() * i, 
                    output);
            }
            input += 1;
        }
    }
    
    // once we have reached the input target, we should stop incrementing
    ms += controller.pollMs();
    if(controller.update(controller.inputTarget(), controller.output(), ms)) {
        // output should not have changed
        if(output != controller.output()) {
            testError("TestUpdateForward Controller erroneously incremented output, %f != %f", 
                controller.output(), 
                output);
        }
    }

}
void TestUpdateReverse() {
    StepController controller;
    float output = 0;
    float input = 0;
    unsigned long ms = controller.pollMs();

    controller.setInputRange(-56.0, 56.0);
    controller.setInputTarget(-40.0);
    controller.setOutputRange(-255, 255);
    controller.setOutputStep(1);
    controller.setOutputStall(24);
    if(controller.update(input, output, ms)) {
        // from a stop, output should jump to stall
        output = controller.output();
        if(output != -controller.outputStall()) {
            testError("TestUpdateReverse Controller did not jump to stall from a stop, %f != %f", -controller.outputStall(), output);
        }
        input -= 1;
    }

    for(int i = 1; input != controller.inputTarget(); i += 1) {
        ms += controller.pollMs();
        if(controller.update(input, controller.output(), ms)) {
            // from a stop, output should jump to stall
            output = controller.output();
            if(output != -1 * (controller.outputStall() + controller.outputStep() * i)) {
                testError("TestUpdateReverse Controller did not increment output, %f != %f", 
                    controller.outputStall() + controller.outputStep() * -i, 
                    output);
            }
        }
        input -= 1;
    }
    
    // once we have reached the input target, we should stop incrementing
    ms += controller.pollMs();
    if(controller.update(controller.inputTarget(), controller.output(), ms)) {
        // output should not have changed
        if(output != controller.output()) {
            testError("TestUpdateReverse Controller erroneously incremented output, %f != %f", 
                controller.output(), 
                output);
        }
    }

}

void TestUpdateReverseSlowdown() {
    StepController controller;
    unsigned long ms = controller.pollMs();

    // slow from -50 to -30
    float output = -225;
    float input = -50;
    controller.setInputRange(-56.0, 56.0);
    controller.setInputTarget(-30);
    controller.setOutputRange(-255, 255);
    controller.setOutputStep(1);
    controller.setOutputStall(24);

    for(int i = 1; input != controller.inputTarget(); i += 1) {
        ms += controller.pollMs();
        if(controller.update(input, output, ms)) {
            // from a stop, output should jump to stall
            output = controller.output();
            if(output != controller.outputStall() + controller.outputStep() * -i) {
                testError("TestUpdateReverseSlowdown Controller did not increment output, %f != %f", 
                    controller.outputStall() + controller.outputStep() * -i, 
                    output);
            }
        }
        input += 1;
    }
    
    // once we have reached the input target, we should stop incrementing
    ms += controller.pollMs();
    if(controller.update(controller.inputTarget(), controller.output(), ms)) {
        // output should not have changed
        if(output != controller.output()) {
            testError("TestUpdateReverseSlowdown Controller erroneously incremented output, %f != %f", 
                controller.output(), 
                output);
        }
    }

}

int main() {
    // from test folder run: 
    // gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/pid/step_control.test.cpp ../src/pid/step_control.cpp; ./a.out; rm a.out

    TestUpdateForward();
    TestUpdateReverse();

    return testResults("step_control");
}
