#include "telemetry.h"
#include "websockets/command_socket.h"
#include "string/strcopy.h"
#include "wheel/drive_wheel.h"
#include "rover/rover.h"
#include "rover/pose.h"

// from main.cpp
extern TwoWheelRover rover;
extern DriveWheel leftWheel;
extern DriveWheel rightWheel;

/**
 * Determine if listening for and sending telemetry
 */
bool TelemetrySender::attached() {
    return nullptr != _messageBus;
}

/**
 * Start listening for messages
 */
void TelemetrySender::attach(MessageBus *messageBus) // IN : message bus on which to listen
{
    if(nullptr != (_messageBus = messageBus)) {
        subscribe(*_messageBus, LOG_CLIENT);
        subscribe(*_messageBus, WHEEL_POWER);
        subscribe(*_messageBus, TARGET_SPEED);
        subscribe(*_messageBus, SPEED_CONTROL);
        subscribe(*_messageBus, ROVER_POSE);
    }
}

/**
 * Stop listening for messages
 */
void TelemetrySender::detach() {
    if(attached()) {

        unsubscribe(*_messageBus, WHEEL_POWER);
        unsubscribe(*_messageBus, TARGET_SPEED);
        unsubscribe(*_messageBus, SPEED_CONTROL);

        _messageBus = nullptr;
    }
}

int jsonNameAt(char *dest, int destSize, int destIndex, const char *name) {
    int offset = strCopyAt(dest, destSize, destIndex, "\"");
    offset = strCopyAt(dest, destSize, offset, name);
    offset = strCopyAt(dest, destSize, offset, "\":");
    return offset;
}
int jsonBoolAt(char *dest, int destSize, int destIndex, const char *name, bool value) {
    int offset = jsonNameAt(dest, destSize, destIndex, name);
    offset = strCopyBoolAt(dest, destSize, offset, value);
    return offset;
}

int jsonIntAt(char *dest, int destSize, int destIndex, const char *name, int value) {
    int offset = jsonNameAt(dest, destSize, destIndex, name);
    offset = strCopyIntAt(dest, destSize, offset, value);
    return offset;
}

int jsonULongAt(char *dest, int destSize, int destIndex, const char *name, unsigned long value) {
    int offset = jsonNameAt(dest, destSize, destIndex, name);
    offset = strCopyULongAt(dest, destSize, offset, value);
    return offset;
}

int jsonFloatAt(char *dest, int destSize, int destIndex, const char *name, float value) {
    int offset = jsonNameAt(dest, destSize, destIndex, name);
    offset = strCopyFloatAt(dest, destSize, offset, value, 6);
    return offset;
}


int strCopyQuotedAt(char *dest, int destSize, int destIndex, const char *quote, const char * value) {
    int offset = strCopyAt(dest, destSize, destIndex, quote);
    offset = strCopyAt(dest, destSize, offset, value);
    offset = strCopyAt(dest, destSize, offset, quote);
    return offset;
}

int jsonStringAt(char *dest, int destSize, int destIndex, const char *name, const char * value) {
    int offset = jsonNameAt(dest, destSize, destIndex, name);
    offset = strCopyQuotedAt(dest, destSize, offset, "\"", value);
    return offset;
}


int jsonOpenObjectAt(char *dest, int destSize, int destIndex, const char *name) {
    int offset = jsonNameAt(dest, destSize, destIndex, name);
    offset = strCopyAt(dest, destSize, offset, "{");
    return offset;
}

int jsonCloseObjectAt(char *dest, int destSize, int destIndex) {
    return strCopyAt(dest, destSize, destIndex, "}");
}

int formatLog(char *buffer, int sizeOfBuffer, const char *src, const char *data) {
    // pwm value was set: pwm value to client as wrapped json: like 'set({left:{forward:true,pwm:255}})'
    int offset = strCopy(buffer, sizeOfBuffer, "log({");
        offset = jsonStringAt(buffer, sizeOfBuffer, offset, "src", src);
        offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");
        offset = jsonStringAt(buffer, sizeOfBuffer, offset, "msg", data);
    offset = strCopyAt(buffer, sizeOfBuffer, offset, "})");

    return offset;
}

int formatWheelPower(char *buffer, int sizeOfBuffer, DriveWheel &driveWheel) {
    // pwm value was set: pwm value to client as wrapped json: like 'set({left:{forward:true,pwm:255}})'
    int offset = strCopy(buffer, sizeOfBuffer, "set({");
        offset = jsonOpenObjectAt(buffer, sizeOfBuffer, offset, (LEFT_WHEEL_SPEC == driveWheel.specifier()) ? "left" : "right");
            offset = jsonBoolAt(buffer, sizeOfBuffer, offset, "forward", driveWheel.forward());
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");
            offset = jsonIntAt(buffer, sizeOfBuffer, offset, "pwm", driveWheel.pwm());
        offset = jsonCloseObjectAt(buffer, sizeOfBuffer, offset);
    offset = strCopyAt(buffer, sizeOfBuffer, offset, "})");

    return offset;
}

int formatTargetSpeed(char *buffer, int sizeOfBuffer, DriveWheel &driveWheel) {
    // target speed was set: pwm value to client as wrapped json: like 'set({left:{target:12.3}})'
    int offset = strCopy(buffer, sizeOfBuffer, "set({");
        offset = jsonOpenObjectAt(buffer, sizeOfBuffer, offset, (LEFT_WHEEL_SPEC == driveWheel.specifier()) ? "left" : "right");
            offset = jsonFloatAt(buffer, sizeOfBuffer, offset, "target", driveWheel.targetSpeed());
        offset = jsonCloseObjectAt(buffer, sizeOfBuffer, offset);
    offset = strCopyAt(buffer, sizeOfBuffer, offset, "})");

    return offset;
}

int formatSpeedControl(char *buffer, int sizeOfBuffer, DriveWheel &driveWheel) {
    // speed control updated: send values to client: like 'tel({left: {forward: true, pwm: 255, target: 12.3, speed: 11.2, distance: 432.1, at:1234567890}})'
    int offset = strCopy(buffer, sizeOfBuffer, "tel({");
        offset = jsonOpenObjectAt(buffer, sizeOfBuffer, offset, (LEFT_WHEEL_SPEC == driveWheel.specifier()) ? "left" : "right");
            // power
            offset = jsonBoolAt(buffer, sizeOfBuffer, offset, "forward", driveWheel.forward());
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");
            offset = jsonIntAt(buffer, sizeOfBuffer, offset, "pwm", driveWheel.pwm());
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");

            // target speed
            offset = jsonFloatAt(buffer, sizeOfBuffer, offset, "target", driveWheel.targetSpeed());
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");

            // measured speed, distance and time of measurement
            offset = jsonFloatAt(buffer, sizeOfBuffer, offset, "speed", driveWheel.speed());
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");
            offset = jsonFloatAt(buffer, sizeOfBuffer, offset, "distance", driveWheel.distance());
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");
            offset = jsonULongAt(buffer, sizeOfBuffer, offset, "at", driveWheel.lastMs());

        offset = jsonCloseObjectAt(buffer, sizeOfBuffer, offset);
    offset = strCopyAt(buffer, sizeOfBuffer, offset, "})");

    return offset;
}

int formatRoverPose(char *buffer, int sizeOfBuffer, Pose2D& pose, unsigned int poseMs) {
    // pose updated: send values to client: like 'tel({pose: {x: 10.1, y: 4.3, a: 0.53, at:1234567890}})'
    int offset = strCopy(buffer, sizeOfBuffer, "pose({");
        offset = jsonOpenObjectAt(buffer, sizeOfBuffer, offset, "pose");
            // position
            offset = jsonFloatAt(buffer, sizeOfBuffer, offset, "x", pose.x);
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");
            offset = jsonFloatAt(buffer, sizeOfBuffer, offset, "y", pose.y);
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");
            offset = jsonFloatAt(buffer, sizeOfBuffer, offset, "a", pose.angle);
            offset = strCopyAt(buffer, sizeOfBuffer, offset, ",");

            // time of measurement
            offset = jsonULongAt(buffer, sizeOfBuffer, offset, "at", poseMs);

        offset = jsonCloseObjectAt(buffer, sizeOfBuffer, offset);
    offset = strCopyAt(buffer, sizeOfBuffer, offset, "})");

    return offset;
}

/**
 * Convert messages into telemetry and
 * send them to the client via the websocket.
 */
void TelemetrySender::onMessage(
    Publisher &publisher,       // IN : publisher of message
    Message message,            // IN : message that was published
    Specifier specifier,        // IN : specifier (like LEFT_WHEEL_SPEC)
    const char *data)           // IN : message data as a c-cstring

{

    switch (message) {
        case LOG_CLIENT: {
            char buffer[256];
            int offset = formatLog(buffer, sizeof(buffer), (LEFT_WHEEL_SPEC == specifier) ? "left" : "right", data);
            wsSendCommandText(buffer, (unsigned int)offset);
            return;
        }
        case WHEEL_HALT: {
            _sending = false;   // don't send telemetry when halted
            return;
        }
        case WHEEL_POWER: {
            char buffer[256];
            DriveWheel& driveWheel = (LEFT_WHEEL_SPEC == specifier) ? leftWheel : rightWheel;
            int offset = formatWheelPower(buffer, sizeof(buffer), driveWheel);
            wsSendCommandText(buffer, (unsigned int)offset);

            _sending = (driveWheel.pwm() > 0);  // don't send a bunch of zero positions
            return;
        }
        case TARGET_SPEED: {
            // target speed was set: pwm value to client as wrapped json: like 'set({left:{target:12.3}})'
            char buffer[256];
            DriveWheel& driveWheel = (LEFT_WHEEL_SPEC == specifier) ? leftWheel : rightWheel;
            int offset = formatTargetSpeed(buffer, sizeof(buffer), driveWheel);
            wsSendCommandText(buffer, (unsigned int)offset);
            return;
        }
        case SPEED_CONTROL: {
            if(!_sending) return;

            // speed control updated: send values to client: like 'tel({left: {forward: true, pwm: 255, target: 12.3, speed: 11.2, distance: 432.1, at:1234567890}})'
            char buffer[256];
            DriveWheel& driveWheel = (LEFT_WHEEL_SPEC == specifier) ? leftWheel : rightWheel;
            int offset = formatSpeedControl(buffer, sizeof(buffer), driveWheel);
            wsSendCommandText(buffer, (unsigned int)offset);
            return;
        }
        case ROVER_POSE: {
            if(!_sending) return;

            // pose updated: send values to client: like 'tel({pose: {x: 10.1, y: 4.3, a: 0.53, at:1234567890}})'
            char buffer[256];
            Pose2D pose = rover.pose();
            int offset = formatRoverPose(buffer, sizeof(buffer), pose, rover.lastPoseMs());
            wsSendCommandText(buffer, (unsigned int)offset);
            return;
        }
        default:
            // unknown message
            break;
    }
}
