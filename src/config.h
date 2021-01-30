#ifndef CONFIG_H
#define CONFIG_H

#include "./util/math.h"

typedef float distance_type;    // from pose.h
typedef float speed_type;       // from drive_wheel.h
typedef long encoder_count_type;// from encoder.h

//
// constants used to configure the application at compile time
//

// pin assignments for motor controller
const int A1_A_PIN = 15;    // left forward input pin
const int A1_B_PIN = 13;    // left reverse input pin
const int B1_B_PIN = 14;    // right forward input pin
const int B1_A_PIN = 2;     // right reverse input pin

const int LEFT_FORWARD_CHANNEL = 12;    // pwm write channel
const int LEFT_REVERSE_CHANNEL = 13;    // pwm write channel
const int RIGHT_FORWARD_CHANNEL = 14;   // pwm write channel
const int RIGHT_REVERSE_CHANNEL = 15;   // pwm write channel


// wheel encoder config
const int LEFT_ENCODER_PIN = 3;             // left LM393 wheel encoder input pin
const int RIGHT_ENCODER_PIN = 1;            // right LM393 wheel encoder input pin
const int PULSES_PER_REVOLUTION = 20 * 2;   // number of slots in encoder wheel * 2 (for changing edge)

const int BUILTIN_LED_PIN = 33;    // not the 'flash' led, the small led

// speed controller constants
const unsigned int CONTROL_POLL_MS = 20;        // how often to run speed controller
const unsigned int CONTROL_HISTORY_LENGTH = 2;  // number of samples used for smoothing speed control
const unsigned int CONTROL_HISTORY_MS = CONTROL_POLL_MS * CONTROL_HISTORY_LENGTH;   // time interval for smoothing speed control
const speed_type SPEED_TOLERANCE = 0.3;         // +/- range for target speed
const encoder_count_type CONTROL_MIN_ENCODER_COUNT = PULSES_PER_REVOLUTION / 4;     // travel at least 1/4 turn before calculating velocity
const unsigned int CONTROL_SETTLE_MS = 20;     // number of milliseconds after changing direction that we
                                               // we continue to integrate encoder ticks in the prior direction
                                               // in order to handle inertia.
// pose
const unsigned int POSE_POLL_MS = 20;        // how often to run pose estimation
const encoder_count_type POSE_MIN_ENCODER_COUNT = CONTROL_MIN_ENCODER_COUNT;     // travel at least 1/5 turn before updating pose


// const float WHEEL_CIRCUMFERENCE = 1.0;  // distance is revolutions, speed is revolutions/sec
// const float WHEEL_CIRCUMFERENCE = PULSES_PER_REVOLUTION;  // distance is pulses, speed is pulses/sec
const float WHEEL_DIAMETER_CM = 6.97;   // centimeters
const float WHEEL_CIRCUMFERENCE = WHEEL_DIAMETER_CM * PI;  // distance is cm, speed is cm/sec
const distance_type WHEELBASE = 13.5;   // centimeters

const distance_type POINT_FORWARD_FRACTION = 0.75;  // position of forward control point as fraction of wheelbase

#endif // CONFIG_H