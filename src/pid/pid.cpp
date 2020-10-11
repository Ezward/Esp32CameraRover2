#include "pid.h"

#define SIGN(_i) ((_i) >= 0)

float ABS(float i) { return SIGN(i) ? i : -i; }
float CONSTRAIN(float i, float min, float max) {
    return (i <= min) ? min : (i >= max) ? max : i;
}

/**
 * Apply controller to current speed at current time 
 * to calculate an updated motor pwm to match target speed.
 */
pwm_type SpeedController::update(
    float currentSpeed,     // IN : motor speed measured at currentMillis
    float currentMillis)    // IN : time currentSpeed was measured
                            // RET: updated pwm value to apply to motor
{
    //
    // use PID controller to update motor power
    //
    const float deltaSeconds = (currentMillis - _millis) / 1000.0;
    const float previousError = _targetSpeed - _speed;
    const float currentError = _targetSpeed - currentSpeed;
    const float derivativeError = (currentError - previousError) / deltaSeconds;

    // if sign of error changes, clear integral error
    const float integralError = (SIGN(previousError) == SIGN(currentError)) ? (_totalError + currentError * deltaSeconds) : 0;

    const pwm_type pwm = CONSTRAIN((pwm_type)ABS(currentError * _Kp + derivativeError * _Kd + integralError * _Ki), _pwm_min, _pwm_max);

    return pwm;
}

