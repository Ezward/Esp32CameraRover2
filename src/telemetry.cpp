#include "telemetry.h"
#include "websockets/command_socket.h"
#include "string/strcopy.h"
#include "wheel/drive_wheel.h"

// from main.cpp
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
        subscribe(*_messageBus, WHEEL_POWER);
        subscribe(*_messageBus, TARGET_SPEED);
        subscribe(*_messageBus, SPEED_CONTROL);
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

int jsonOpenObjectAt(char *dest, int destSize, int destIndex, const char *name) {
    int offset = jsonNameAt(dest, destSize, destIndex, name);
    offset = strCopyAt(dest, destSize, offset, "{");
    return offset;
}

int jsonCloseObjectAt(char *dest, int destSize, int destIndex) {
    return strCopyAt(dest, destSize, destIndex, "}");
}


/**
 * Convert messages into telemetry and
 * send them to the client via the websocket.
 */
void TelemetrySender::onMessage(
    Publisher &publisher,       // IN : publisher of message
    Message message,            // IN : message that was published
    Specifier specifier)        // IN : specifier (like LEFT_WHEEL)
{
    char buffer[256];

    switch (message) {
        case WHEEL_HALT: {
            _sending = false;
            return;
        }
        case WHEEL_POWER: {
            // pwm value was set: pwm value to client as wrapped json: like 'set({left:{forward:true,pwm:255}})'
            int offset = strCopy(buffer, sizeof(buffer), "set({");
                offset = jsonOpenObjectAt(buffer, sizeof(buffer), offset, (LEFT_WHEEL == specifier) ? "left" : "right");
                    bool forward = (LEFT_WHEEL == specifier) ? leftWheel.forward() : rightWheel.forward();
                    offset = jsonBoolAt(buffer, sizeof(buffer), offset, "forward", forward);
                    offset = strCopyAt(buffer, sizeof(buffer), offset, ",");
                    pwm_type pwm = (LEFT_WHEEL == specifier) ? leftWheel.pwm() : rightWheel.pwm();
                    offset = jsonIntAt(buffer, sizeof(buffer), offset, "pwm", pwm);
                offset = jsonCloseObjectAt(buffer, sizeof(buffer), offset);
            offset = strCopyAt(buffer, sizeof(buffer), offset, "})");

            wsSendCommandText(buffer, (unsigned int)offset);

            _sending = (pwm > 0);
            return;
        }
        case TARGET_SPEED: {
            // target speed was set: pwm value to client as wrapped json: like 'set({left:{target:12.3}})'
            float speed = (LEFT_WHEEL == specifier) ? leftWheel.targetSpeed() : rightWheel.targetSpeed();
            int offset = strCopy(buffer, sizeof(buffer), "set({");
                offset = jsonOpenObjectAt(buffer, sizeof(buffer), offset, (LEFT_WHEEL == specifier) ? "left" : "right");
                    offset = jsonFloatAt(buffer, sizeof(buffer), offset, "target", speed);
                offset = jsonCloseObjectAt(buffer, sizeof(buffer), offset);
            offset = strCopyAt(buffer, sizeof(buffer), offset, "})");

            wsSendCommandText(buffer, (unsigned int)offset);
            return;
        }
        case SPEED_CONTROL: {
            if(!_sending) return;

            // speed control updated: send values to client: like 'tel({left: {forward: true, pwm: 255, target: 12.3, speed: 11.2, distance: 432.1, at:1234567890}})'
            int offset = strCopy(buffer, sizeof(buffer), "tel({");
                offset = jsonOpenObjectAt(buffer, sizeof(buffer), offset, (LEFT_WHEEL == specifier) ? "left" : "right");
                    // power
                    bool forward = (LEFT_WHEEL == specifier) ? leftWheel.forward() : rightWheel.forward();
                    pwm_type pwm = (LEFT_WHEEL == specifier) ? leftWheel.pwm() : rightWheel.pwm();
                    offset = jsonBoolAt(buffer, sizeof(buffer), offset, "forward", forward);
                    offset = strCopyAt(buffer, sizeof(buffer), offset, ",");
                    offset = jsonIntAt(buffer, sizeof(buffer), offset, "pwm", pwm);
                    offset = strCopyAt(buffer, sizeof(buffer), offset, ",");

                    // target speed
                    speed_type target = (LEFT_WHEEL == specifier) ? leftWheel.targetSpeed() : rightWheel.targetSpeed();
                    offset = jsonFloatAt(buffer, sizeof(buffer), offset, "target", target);
                    offset = strCopyAt(buffer, sizeof(buffer), offset, ",");

                    // measured speed, distance and time of measurement
                    speed_type speed = (LEFT_WHEEL == specifier) ? leftWheel.speed() : rightWheel.speed();
                    offset = jsonFloatAt(buffer, sizeof(buffer), offset, "speed", speed);
                    offset = strCopyAt(buffer, sizeof(buffer), offset, ",");
                    float distance = (LEFT_WHEEL == specifier) ? leftWheel.distance() : rightWheel.distance();
                    offset = jsonFloatAt(buffer, sizeof(buffer), offset, "distance", distance);
                    offset = strCopyAt(buffer, sizeof(buffer), offset, ",");
                    unsigned long lastMs = (LEFT_WHEEL == specifier) ? leftWheel.lastMs() : rightWheel.lastMs();
                    offset = jsonULongAt(buffer, sizeof(buffer), offset, "at", lastMs);

                offset = jsonCloseObjectAt(buffer, sizeof(buffer), offset);
            offset = strCopyAt(buffer, sizeof(buffer), offset, "})");

            wsSendCommandText(buffer, (unsigned int)offset);
            return;
        }
        default:
            // unknown message
            break;
    }
}
