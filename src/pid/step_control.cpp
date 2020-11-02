
#include "../util/math.h"

class StepController {
    private:
    float _inputTarget = 0.0;
    float _inputMin = -1.0;
    float _inputMax = 1.0;

    float _outputStall = 0.0;
    float _outputMin = -1.0;
    float _outputMax = 1.0;
    float _outputStep = 0.01;
    float _output = 0.0;

    unsigned int _pollMs = 50;
    unsigned long _lastMs = 0;

    StepController& setInputRange(float inputMin, float inputMax) {
        _inputMin = inputMin;
        _inputMax = inputMax;
        return *this;
    }
    float inputMin() { return _inputMin; }
    float inputMax() { return _inputMax; }

    /**
     * Set target value (in input units) that
     * the controller tries to reach and maintain.
     */
    StepController& setInputTarget(float target) 
    { 
        _inputTarget = target; 
        return *this; 
    }
    float inputTarget() { return _inputTarget; }

    StepController& setOutputRange(float outputMin, float outputMax) {
        _outputMin = outputMin;
        _outputMax = outputMax;
        return *this;
    }
    float outputMin() { return _outputMin; }
    float outputMax() { return _outputMax; }


    /**
     * Output stall is the value around zero that
     * is treated as zero.  For instance, a DC
     * may not start moving until a PWM value that 
     * is well above zero is sent to it because 
     * below this the applied voltage is too low 
     * to turn the motor.
     * 
     * Setting this value allows the StepController
     * to skip output values between zero and the
     * stall value when first starting the motor or
     * when changing direction.
     */
    StepController& setOutputStall(float outputStall) {
        _outputStall = outputStall;
        return *this;
    }
    float outputStall() { return _outputStall; }

    /**
     * Set output increment controller by which
     * the controller changes the output. 
     */
    StepController& setOutputStep(
        float increment)    // IN : amount to change output
                            //      if targetInput is not matched
                            // RET: This StepController
    {
        _outputStep = increment;
        return *this;
    }
    float outputStep() { return _outputStep; }


    /**
     * The time between control updates
     */
    StepController& setPollMs(unsigned int pollMs) {
        _pollMs = pollMs;
        return *this;
    }
    unsigned int pollMs() { return _pollMs; }

    /**
     * Get the most recent control output value
     */
    float output()  // RET: last updated control output
    {
        return _output;
    }

    /**
     * Poll the closed loop (PID) speed control
     */
    bool update(
        const float input,      // IN : current input value
        const float output,     // IN : current output value
        const unsigned long ms) // IN : current time in milliseconds
                                // RET: true if output updated
                                //      false if output not updated
    {
        //
        // determine if enough time has gone by to run speed control
        //
        if((0 == _lastMs) || (ms >= (_lastMs + _pollMs))) {
            if(0 != _inputTarget) {
                _output = output;
                if((0 != input) && (sign(input) != sign(_inputTarget))) {
                    // we are changing direction, start at zero
                    _output = 0;
                } else if(abs(input) > abs(_inputTarget)) {
                    // slow down (move towards zero)
                    if(_output >= 0) {
                        _output = dec(_output, _outputStep, (float)0);
                    } else {
                        _output = inc(_output, _outputStep, (float)0);
                    }
                    // if((0 == input) || (sign(input) != sign(_inputTarget))) {
                    //     // we are starting from stop OR
                    //     // we are changing direction, 
                    //     // then skip to stall value
                    //     _output = -(_outputStall);
                    // } else {
                    //     _output = dec(_output, _outputStep, _outputMin);
                    // }
                } else if(abs(input) < abs(_inputTarget)) {
                    // speed up (move away from zero)
                    if(_output >= 0) {
                        _output = inc(_output, _outputStep, _outputMax);
                    } else {
                        _output = dec(_output, _outputStep, _outputMin);
                    }
                    // if((0 == input) || (sign(input) != sign(_inputTarget))) {
                    //     // we are starting from a stop OR 
                    //     // we are changing direction, 
                    //     // then skip to stall value
                    //     _output = _outputStall;
                    // } else {
                    //     _output = inc(_output, _outputStep, _outputMax);
                    // }
                }
            } else {
                // _inputTarget == 0
                _output = 0;
            }

            _lastMs = ms;
            return true;
        }

        return false;
    }
};

