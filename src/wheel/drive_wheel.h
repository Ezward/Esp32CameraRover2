#ifndef DRIVE_WHEEL_H
#define DRIVE_WHEEL_H

#include "../motor/motor_l9110s.h"
#include "../encoder/encoder.h"
#include "../pid/pid.h"
#include "../message_bus/message_bus.h"
#include "../util/circular_buffer.h"

#include "../config.h"

typedef float speed_type;
typedef struct history_type {
    unsigned long millis;
    float distance;
} history_type;

extern history_type _historyDefault; // default value for empty history 

class DriveWheel : Publisher {
    private:

    // wheel characteristics
    const float _circumference;
    encoder_count_type _pulsesPerRevolution = 0;

    // speed control
    static const unsigned int _pollSpeedMillis = CONTROL_POLL_MS;  // how often to run closed loop speed control
    bool _useSpeedControl = false;
    speed_type _targetSpeed = 0;
    speed_type _lastSpeed = 0;
    speed_type _lastTotalError = 0;

    // motor state
    pwm_type _pwm = 0;
    pwm_type _forward = 1;
    pwm_type _stall_pwm = 0;

    // attached parts
    MotorL9110s *_motor = nullptr;
    Encoder *_encoder = nullptr;
    SpeedController *_controller = nullptr;
    MessageBus *_messageBus = nullptr;

    //
    // we keep history of distance measurements at given time
    // using circular buffers.  This allows us to calculate
    // a smoothed speed often.  
    // - to use the singular instantaneous speed, use _historyLength = 1
    //
    history_type _historyBuffer[CONTROL_HISTORY_LENGTH];  // number of samples for control smoothing
    CircularBuffer<history_type> _history;

    /**
     * Poll the wheel encoder
     */
    DriveWheel& _pollEncoder();   // RET: this drive wheel

    /**
     * Poll the closed loop (PID) speed control
     */
    DriveWheel& _pollSpeed(); // RET: this drive wheel

    public:

    DriveWheel(
        const Specifier specifier,  // IN : which wheel
        float circumference)        // IN : circumference of wheel.
                                    //      Note: use 1.0 to deal in pulsesPerRevolution of encoder
        :   Publisher(specifier), 
            _circumference(circumference), 
            _history(_historyBuffer, sizeof(_historyBuffer) / sizeof(history_type), _historyDefault)
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
     * Attach drive wheel dependencies
     */
    DriveWheel& attach(
        MotorL9110s &motor,         // IN : left wheel's motor
        Encoder *encoder,           // IN : pointer to the wheel encoder
                                    //      or NULL if encoder not used
        int pulsesPerRevolution,    // IN : encoder pulses in one wheel turn
        SpeedController *controller,// IN : point to pid controller
                                    //      or NULL if not pid controller used
        MessageBus *messageBus);    // IN : pointer to MessageBus to publish state changes
                                    //      or NULL to not publish state changes
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
     * Immediately stop the rover and disengage speed control
     * if it is engaged (if setSpeed() has been called)
     */
    DriveWheel& halt(); // RET: this drive wheel

    /**
     * Get motor's pwm value
     */
    pwm_type pwm() { return (nullptr != _motor) ? _motor->pwm() : 0; }

    /**
     * Get motor's forward value
     */
    bool forward() { return (nullptr != _motor) ? _motor->forward() : true; }

    /**
     * Send speed and direction to left wheel.
     * 
     * NOTE: your code should use either 
     *       setPower() or setSpeed() but not both.
     */
    DriveWheel& setPower(
        bool forward,   // IN : true to move wheel in forward direction
                        //      false to move wheel in reverse direction
        pwm_type pwm);  // IN : pwm value to send to motor
                        // RET: this drive wheel

    /**
     * Get the last set target speed
     */
    speed_type targetSpeed() // RET: last value passed to setSpeed()
    { 
        return this->_targetSpeed; 
    }

    /**
     * Get the last measured speed
     */
    speed_type speed() // RET: last measured speed
    { 
        return this->_lastSpeed;
    }

    /**
     * Get the last measured total distance travelled
     */
    float distance()    // RET: last measured total distance
    {
        // entry at head of circular buffer is most recent
        return _history.head().distance;
    }

    /**
     * Get the last measured time in ms from startup
     */
    unsigned long lastMs()   // RET: time of last measurement in ms
    {
        // entry at head of circular buffer is most recent
        return _history.head().millis;
    }

    /**
     * Set target wheel speed.
     * 
     * The first time this is called, it will enable the
     * speed controller, which will then start
     * maintaining the requested target speed.
     * Calling halt() will disable the speed controller.
     * 
     * NOTE: your code should use either 
     *       setPower() or setSpeed() but not both.
     */
    DriveWheel& setSpeed(speed_type speed); // IN : target speed
                                            // RET: this drive wheel
};

#endif // DRIVE_WHEEL_H
