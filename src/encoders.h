#ifndef ENCODERS_H
#define ENCODERS_H

#include "encoder/encoder.h"

extern void attachEncoderInterrupts(Encoder &leftWheelEncoder, Encoder &rightWheelEncoder, encoder_count_type pulsesPerRevolution);
extern void detachEncoderInterrupts(int leftInputPin, int rightInputPin);
extern bool encoderInterruptsAttached();

extern unsigned int pulsesPerRevolution();

#endif // ENCODERS_H