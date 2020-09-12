#ifndef ENCODERS_H
#define ENCODERS_H

extern void attachWheelEncoders(int leftInputPin, int rightInputPin);
extern void detachWheelEncoders(int leftInputPin, int rightInputPin);
extern unsigned int readLeftWheelEncoder();
extern unsigned int readRightWheelEncoder();
extern void logWheelEncoders();

#endif // ENCODERS_H