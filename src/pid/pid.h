#ifndef PID_H
#define PID_H

#include "../gpio/pwm.h"

/**
 * controller to that outputs pwm values to maintain target motor speed
 */
class SpeedController {
    pwm_type _pwm_min = 0;
    pwm_type _pwm_max = 255;

    float _Kp = 0;
    float _Ki = 0;
    float _Kd = 0;

    float _targetSpeed;
    unsigned long _millis;
    float _speed;
    float _totalError = 0;

    public:

    SpeedController()
        :   _Kp(0), _Ki(0), _Kd(0), 
            _targetSpeed(0), 
            _millis(0), 
            _speed(0) 
    {
    }

    SpeedController(float Kp, float Ki, float Kd, float targetSpeed, float initialSpeed, unsigned long initialMillis)
        :   _Kp(Kp), _Ki(Ki), _Kd(Kd), 
            _targetSpeed(targetSpeed), 
            _millis(initialMillis), 
            _speed(initialSpeed) 
    {
    }

    float Kp() { return _Kp; }
    SpeedController& setKp(float Kp) { _Kp = Kp; return *this; }

    float Ki() { return _Ki; }
    SpeedController& setKi(float Ki) { _Ki = Ki; return *this; }

    float Kd() { return _Kd; }
    SpeedController& setKd(float Kd) { _Kd = Kd; return *this; }

    /**
     * Get the maximum allowed output pwm value.
     * This should match the target motor's capability.
     */
    pwm_type maxPwm() { return _pwm_max; }  // RET: maximum output pwm value

    /**
     * Set the maximum allowed output pwm value.
     * This should be set based on the target motor's capability.
     */
    SpeedController& setMaxPwm(pwm_type pwm); // IN : maximum allowed output pwm value
                                             // RET: this SpeedController

    /**
     * Get the pwm value at or below which the motor stalls
     */
    pwm_type stallPwm() { return _pwm_min; }    // RET: pwm value at or below which the motor stalls

    /**
     * Set the pwm value at or below which the motor stalls
     */
    SpeedController& setStallPwm(pwm_type pwm); // IN : pwm value at or below which the motor stalls
                                                // RET: this SpeedController

    /**
     * Get the speed controller's target speed
     */
    float targetSpeed() { return _targetSpeed; }    // RET: target speed

    /**
     * Set the speed controller's target speed
     */
    SpeedController& setTargetSpeed(float speed);   // IN : target speed
                                                    // RET: this SpeedController

    /**
     * Get last measured speed.
     */
    float speed() { return _speed; }    // RET: speed measured at millis()

    /**
     * Get last time speed was measured
     */
    unsigned long millis() { return _millis;}   // RET: last time speed() was measured.

    /**
     * Reset controller and errors
     */
    SpeedController& reset(
        float currentSpeed,     // IN : motor speed measured at currentMillis
        float currentMillis);   // IN : time currentSpeed was measured
                                // RET: this SpeedController


    /**
     * Apply controller to current speed at current time 
     * to calculate an updated motor pwm to match target speed.
     */
    pwm_type update(
        float currentSpeed,     // IN : motor speed measured at currentMillis
        float currentMillis);   // IN : time currentSpeed was measured
                                // RET: updated pwm value to apply to motor

};

#endif // PID_H
