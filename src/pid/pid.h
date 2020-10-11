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
    SpeedController& setKI(float Ki) { _Ki = Ki; return *this; }

    float Kd() { return _Kd; }
    SpeedController& setKd(float Kd) { _Kd = Kd; return *this; }

    pwm_type maxPwm() { return _pwm_max; }
    SpeedController& setMaxPwm(pwm_type pwm) { _pwm_max = pwm; return *this; }

    pwm_type minPwm() { return _pwm_min; }
    SpeedController& setMinPwm(pwm_type pwm) { _pwm_min = pwm; return *this; }

    float targetSpeed() { return _targetSpeed; }
    SpeedController& setTargetSpeed(float speed) { _targetSpeed = speed; return *this; }

    float speed() { return _speed; }
    unsigned long millis() { return _millis;}

    /**
     * Reset controller and errors
     */
    SpeedController& reset(
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
    pwm_type update(
        float currentSpeed,     // IN : motor speed measured at currentMillis
        float currentMillis);   // IN : time currentSpeed was measured
                                // RET: updated pwm value to apply to motor

};

#endif // PID_H
