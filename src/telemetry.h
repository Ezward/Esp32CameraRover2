#ifndef TELEMETRY_H
#define TELEMETRY_H

#include "message_bus/message_bus.h"


/**
 * Class to listen for telemetry messages
 * and send them to client via websocket
 */
class TelemetrySender : Subscriber {
    private:

    static const unsigned int TELEMETRY_BUFFER_COUNT = 8;
    static const unsigned int TELEMETRY_BUFFER_BYTES = 128;

    char _telemetryBuffer[TELEMETRY_BUFFER_COUNT][TELEMETRY_BUFFER_BYTES];
    int _telemetryCount = 0;        // number of telemetry buffers to send
    int _telemetryWriteIndex = 0;   // index of buffer to write to

    MessageBus *_messageBus = nullptr;
    bool _sending = false;

    /**
     * Get pointer to telemetry buffer
     */
    char *_getBuffer();

    public:



    /**
     * Determine if listening for and sending telemetry
     */
    bool attached();

    /**
     * Start listening for messages
     */
    void attach(MessageBus *messageBus); // IN : message bus on which to listen

    /**
     * Stop listening for messages
     */
    void detach();

    /**
     * Convert messages into telemetry and
     * send them to the client via the websocket.
     */
    virtual void onMessage(
        Publisher &publisher,       // IN : publisher of message
        Message message,            // IN : message that was published
        Specifier specifier,        // IN : specifier (like LEFT_WHEEL_SPEC)
        const char *data);          // IN : message data as a c-cstring

    /**
     * If there is telemetry buffered, then send it
     */
    void poll();


};

#endif // TELEMETRY_H