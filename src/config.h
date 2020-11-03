#ifndef CONFIG_H
#define CONFIG_H

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
const unsigned int CONTROL_POLL_MS = 50;        // how often to run speed controller
const unsigned int CONTROL_HISTORY_LENGTH = 5;  // number of samples used for smoothing speed control
const unsigned int CONTROL_HISTORY_MS = CONTROL_POLL_MS * CONTROL_HISTORY_LENGTH;   // time interval for smoothing speed control

// const float WHEEL_DIAMETER_CM = 6.3;
// const float WHEEL_CIRCUMFERENCE = WHEEL_DIAMETER_CM * 3.14159;  // treat speed as cm/sec
// const float WHEEL_CIRCUMFERENCE = 1.0;  // treat speed as revolutions per second
const float WHEEL_CIRCUMFERENCE = PULSES_PER_REVOLUTION;  // treat speed as pulses per second


#endif // CONFIG_H