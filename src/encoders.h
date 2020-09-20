#ifndef ENCODERS_H
#define ENCODERS_H

typedef void (*EncoderLogger)(const char *, int);

void attachWheelEncoders(unsigned int pulsesPerRevolution, int leftInputPin, int rightInputPin);
extern void detachWheelEncoders(int leftInputPin, int rightInputPin);
extern unsigned int pulsesPerRevolution();
extern unsigned int readLeftWheelEncoder();
extern unsigned int readRightWheelEncoder();
extern void logWheelEncoders(EncoderLogger logger);

#endif // ENCODERS_H