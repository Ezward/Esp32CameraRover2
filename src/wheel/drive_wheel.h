#ifndef DRIVE_WHEEL_H
#define DRIVE_WHEEL_H

#include "../motor/motor_l9110s.h"
#include "../encoder/encoder.h"

class DriveWheel {
    private:

    const float _circumference;

    pwm_type _pwm = 0;
    pwm_type _forward = 1;

    MotorL9110s *_motor = NULL;
    Encoder *_encoder = NULL;

    /**
     * Poll the wheel encoder
     */
    DriveWheel& _pollEncoder();   // RET: this rover

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
     * Attach rover dependencies
     */
    DriveWheel& attach(
        MotorL9110s &motor,         // IN : left wheel's motor
        Encoder *encoder,           // IN : pointer to the wheel encoder
                                    //      or NULL if encoder not used
        int pulsesPerRevolution);   // IN : encoder pulses in one wheel turn
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

};

#endif // DRIVE_WHEEL_H
