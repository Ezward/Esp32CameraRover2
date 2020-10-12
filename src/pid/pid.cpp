#include "pid.h"

#define SIGN(_i) ((_i) >= 0)

float ABS(float i) { return SIGN(i) ? i : -i; }
float CONSTRAIN(float i, float min, float max) {
    return (i <= min) ? min : (i >= max) ? max : i;
}

/**
 * Set the target speed
 */
SpeedController& SpeedController::setTargetSpeed(float speed) { 
    if(_targetSpeed != speed) {
        _targetSpeed = speed; 
        _totalError = 0;
    }
    return *this; 
}

/**
 * Set the pwm value at or below which the motor stalls
 */
SpeedController& SpeedController::setStallPwm(pwm_type pwm)  // IN : pwm value at or below which the motor stalls
                                            // RET: this SpeedController
{ 
    _pwm_min = CONSTRAIN(pwm, 0, maxPwm()); 
    return *this; 
}

/**
 * Set the maximum allowed output pwm value.
 * This should be set based on the target motor's capability.
 */
SpeedController& SpeedController::setMaxPwm(pwm_type pwm) // IN : maximum allowed output pwm value
                                            // RET: this SpeedController
{ 
    _pwm_max = pwm; return *this; 
} 

/**
 * Reset controller and errors
 */
SpeedController& SpeedController::reset(
    float currentSpeed,     // IN : motor speed measured at currentMillis
    float currentMillis)    // IN : time currentSpeed was measured
                            // RET: this SpeedController
{
    _speed = currentSpeed;
    _millis = currentMillis;
    _totalError = 0;

    return *this;
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
    // We always want a positive output pwm value (an unsigned value),
    // so force speed to be positive.
    // 
    // The outer logic will use it's notion of the 
    // sign of the speed to decide whether to use this value
    // as a forward pwm or as a reverse pwm before
    // it sends it to the motor.
    //
    currentSpeed = ABS(currentSpeed);

    //
    // update errors
    //
    const float deltaSeconds = (currentMillis - _millis) / 1000.0;
    const float previousError = _targetSpeed - _speed;
    const float currentError = _targetSpeed - currentSpeed;
    const float derivativeError = (currentError - previousError) / deltaSeconds;

    //
    // If the sign of error changes, that means we have crossed 
    // over the target value at some point in last interval.
    // In this case, we know error went to zero during that time
    // and we don't want the prior residual error from one 'side'
    // of the target to affect convergence on the other
    // side of the target.
    // So in this case we zero out the prior integral error.
    //
    if(SIGN(previousError) != SIGN(currentError)) {
        _totalError = 0;
    }
    const float integralError = _totalError + currentError * deltaSeconds;

    //
    // apply gain coefficients and constrain the output to legal values
    //
    const pwm_type pwm = CONSTRAIN((pwm_type)(currentError * _Kp + derivativeError * _Kd + integralError * _Ki), _pwm_min, _pwm_max);

    return pwm;
}

