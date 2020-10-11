#ifndef DRIVE_WHEEL_H
#define DRIVE_WHEEL_H

#include "../motor/motor_l9110s.h"
#include "../encoder/encoder.h"
#include "../pid/pid.h"

typedef float speed_type;

class DriveWheel {
    private:

    const float _circumference;
    encoder_count_type _pulsesPerRevolution = 0;

    speed_type _targetSpeed = 0;
    speed_type _lastSpeed = 0;
    float _lastDistance = 0;
    float _lastTotalError = 0;
    unsigned long _lastMillis = 0;
    const unsigned long _pollSpeedMillis = 50;  // how often to run closed loop speed control

    pwm_type _pwm = 0;
    pwm_type _forward = 1;
    pwm_type _stall_pwm = 0;

    MotorL9110s *_motor = NULL;
    Encoder *_encoder = NULL;
    SpeedController *_controller = NULL;

    /**
     * Poll the wheel encoder
     */
    DriveWheel& _pollEncoder();   // RET: this drive wheel

    /**
     * Poll the closed loop (PID) speed control
     */
    DriveWheel& _pollSpeed(); // RET: this drive wheel

    public:

    DriveWheel(float circumference)
        : _circumference(circumference)
    {

    }

    ~DriveWheel() {
        detach();
    }

    /**
     * Get the circumference of the wheel
     */
    bool circumference();   // RET: circumference passed to constructor

    /**
     * Determine if drive wheel's dependencies are attached
     */
    bool attached();

    /**
     * Get the motor stall value
     */
    pwm_type stallPwm(); // RET: the pwm at or below which the motor will stall

    /**
     * Set the motor stall value
     */
    DriveWheel& setStallPwm(pwm_type pwm);  // IN : pwm at which motor will stall
                                            // RET: this motor

    /**
     * Attach rover dependencies
     */
    DriveWheel& attach(
        MotorL9110s &motor,          // IN : left wheel's motor
        Encoder *encoder,            // IN : pointer to the wheel encoder
                                    //      or NULL if encoder not used
        int pulsesPerRevolution,     // IN : encoder pulses in one wheel turn
        SpeedController *controller);// IN : point to pid controller
                                    //      or NULL if not pid controller used
                                    // RET: this wheel in attached state

    /**
     * Detach drive wheel dependencies
     */
    DriveWheel& detach(); // RET: this drive wheel in detached state

    /**
     * Read value of the wheel encoder
     */
    encoder_count_type readEncoder(); // RET: wheel encoder count

    /**
     * Poll rover systems
     */
    DriveWheel& poll();   // RET: this rover

    /**
     * immediately stop the wheel
     */
    DriveWheel& halt(); // RET: this drive wheel

    /**
     * send speed and direction to left wheel
     */
    DriveWheel& setPower(
        bool forward,   // IN : true to move wheel in forward direction
                        //      false to move wheel in reverse direction
        pwm_type pwm);  // IN : pwm value to send to motor
                        // RET: this drive wheel

    /**
     * Set target wheel speed
     */
    DriveWheel& setSpeed(speed_type speed); // IN : target speed
                                            // RET: this drive wheel
};

#endif // DRIVE_WHEEL_H
