#include "telemetry.h"
#include "websockets/command_socket.h"
#include "string/strcopy.h"
#include "util/circular_buffer.h"
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

int formatHalt(char *buffer, int sizeOfBuffer, const char *src, const char *data) {
    // pwm value was set: pwm value to client as wrapped json: like 'set({left:{forward:true,pwm:255}})'
    int offset = strCopy(buffer, sizeOfBuffer, "halt({");
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
            char *buffer = _getBuffer();
            if(nullptr != buffer) {
                formatLog(buffer, TELEMETRY_BUFFER_BYTES, (LEFT_WHEEL_SPEC == specifier) ? "left" : "right", data);
            }
            return;
        }
        case WHEEL_HALT: {
            char *buffer = _getBuffer();
            if(nullptr != buffer) {
                formatLog(buffer, TELEMETRY_BUFFER_BYTES, Specifiers[specifier], data ? data : "");
            }
            _sending = false;   // don't send telemetry when halted
            return;
        }
        case WHEEL_POWER: {
            DriveWheel& driveWheel = (LEFT_WHEEL_SPEC == specifier) ? leftWheel : rightWheel;
            
            char *buffer = _getBuffer();
            if(nullptr != buffer) {
                formatWheelPower(buffer, TELEMETRY_BUFFER_BYTES, driveWheel);
            }

            _sending = (driveWheel.pwm() > 0);  // don't send a bunch of zero positions
            return;
        }
        case TARGET_SPEED: {
            // target speed was set: pwm value to client as wrapped json: like 'set({left:{target:12.3}})'
            char *buffer = _getBuffer();
            if(nullptr != buffer) {
                DriveWheel& driveWheel = (LEFT_WHEEL_SPEC == specifier) ? leftWheel : rightWheel;
                formatTargetSpeed(buffer, TELEMETRY_BUFFER_BYTES, driveWheel);
            }
            return;
        }
        case SPEED_CONTROL: {
            if(!_sending) return;

            // speed control updated: send values to client: like 'tel({left: {forward: true, pwm: 255, target: 12.3, speed: 11.2, distance: 432.1, at:1234567890}})'
            char *buffer = _getBuffer();
            if(nullptr != buffer) {
                DriveWheel& driveWheel = (LEFT_WHEEL_SPEC == specifier) ? leftWheel : rightWheel;
                formatSpeedControl(buffer, TELEMETRY_BUFFER_BYTES, driveWheel);
            }
            return;
        }
        case ROVER_POSE: {
            if(!_sending) return;

            // pose updated: send values to client: like 'tel({pose: {x: 10.1, y: 4.3, a: 0.53, at:1234567890}})'
            char *buffer = _getBuffer();
            if(nullptr != buffer) {
                Pose2D pose = rover.pose();
                formatRoverPose(buffer, TELEMETRY_BUFFER_BYTES, pose, rover.lastPoseMs());
            }
            return;
        }
        default:
            // unknown message
            break;
    }
}

/**
 * Get pointer to telemetry buffer
 */
char* TelemetrySender::_getBuffer() {
    //
    // buffer is a circular queue of buffers
    //
    if(_telemetryCount < TELEMETRY_BUFFER_COUNT) {
        char *buffer = _telemetryBuffer[_telemetryWriteIndex];
        _telemetryWriteIndex = (_telemetryWriteIndex + 1) % TELEMETRY_BUFFER_COUNT;
        _telemetryCount += 1;
        return buffer;
    }

    return nullptr;
}


/**
 * If there is telemetry buffered, then send it
 */
void TelemetrySender::poll() 
{
    // if there is telemetry queued, then send one
    // of them during this polling session
    if(_telemetryCount > 0) {
        // get index of telemetry at start of queue
        const int index = (_telemetryWriteIndex - _telemetryCount) % TELEMETRY_BUFFER_COUNT;

        // if telemetry is not an empty string, then send it.
        if(_telemetryBuffer[index][0]) {
            wsSendCommandText(_telemetryBuffer[index], strlen(_telemetryBuffer[index]));
        }

        // remove it from the queue
        _telemetryBuffer[index][0] = 0;
        _telemetryCount -= 1;
    }
}
