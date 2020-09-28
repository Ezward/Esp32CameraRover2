#ifndef ENCODERS_H
#define ENCODERS_H

#include "encoder/encoder.h"

extern void attachWheelEncoders(Encoder &leftWheelEncoder, Encoder &rightWheelEncoder, encoder_count_type pulsesPerRevolution);
extern void detachWheelEncoders(int leftInputPin, int rightInputPin);
extern bool wheelEncodersAttached();

extern unsigned int pulsesPerRevolution();
extern int readLeftWheelEncoder();
extern int readRightWheelEncoder();
extern void logWheelEncoders(EncoderLogger logger);

#endif // ENCODERS_H