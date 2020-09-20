#include <Arduino.h>
#include <WebSocketsServer.h>
#include "./command_socket.h"

#include "string/strcopy.h"
#include "camera_wrap.h"
#include "error.h"

#define LOG_LEVEL ERROR_LEVEL
#include "./log.h"

void wsStreamEvent(unsigned char clientNum, WStype_t type, uint8_t * payload, size_t length);

WebSocketsServer wsStream = WebSocketsServer(81);

void wsStreamInit() {
    wsStream.begin();
    wsStream.onEvent(wsStreamEvent);
}


int cameraClientId = -1;        // websocket client id for camera streaming
bool isCameraStreamOn = false;  // true if streaming, false if not

void wsStreamPoll() {
    wsStream.loop();
}

//
// send the given image buffer down the websocket
//
int wsStreamSendImage(unsigned char *imageBuffer, unsigned int bufferSize) {
    if (wsStream.sendBIN(cameraClientId, imageBuffer, bufferSize)) {
        return SUCCESS;
    }
    return FAILURE;
}

//
// get a camera image and send it down websocket
//
void wsStreamCameraImage() {
    if (isCameraStreamOn && (cameraClientId >= 0)) {
        //
        // grab and image and call sendImage on it
        //
        esp_err_t result = processImage(wsStreamSendImage);
        if (SUCCESS != result) {
            LOG_ERROR("Failure grabbing and sending image.");
        }
    }
}

void logWsStreamEvent(
    const char *event,  // IN : name of event as null terminated string
    const int id)       // IN : client id to copy
{
    #ifdef LOG_LEVEL
        #if (LOG_LEVEL >= INFO_LEVEL)
            char msg[128];
            int offset = strCopy(msg, sizeof(msg), event);
            offset = strCopyAt(msg, sizeof(msg), offset, ", clientId: ");
            strCopyIntAt(msg, sizeof(msg), offset, id);
            LOG_INFO(msg);
        #endif
    #endif
}

void wsStreamEvent(unsigned char clientNum, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_CONNECTED: {
            logWsStreamEvent("wsStreamEvent.WS_EVT_CONNECT", clientNum);
            wsStream.sendPing(clientNum, (uint8_t *)"ping", sizeof("ping"));
            return;
        }
        case WStype_DISCONNECTED: {
            // os_printf("wsStream[%s][%u] disconnect: %u\n", server->url(), client->id());
            logWsStreamEvent("wsStreamEvent.WS_EVT_DISCONNECT", clientNum);
            if (cameraClientId == clientNum) {
                cameraClientId = -1;
                isCameraStreamOn = false;
            }
            return;
        } 
        case WStype_PONG: {
            logWsStreamEvent("wsStreamEvent.WStype_PONG", clientNum);
            cameraClientId = clientNum;
            isCameraStreamOn = true;
            return;
        }
        case WStype_BIN: {
            logWsStreamEvent("wsStreamEvent.WStype_BIN", clientNum);
            return;
        }
        case WStype_TEXT: {
            char buffer[128];
            int offset = strCopy(buffer, sizeof(buffer), "wsStreamEvent.WStype_TEXT: ");
            strCopySizeAt(buffer, sizeof(buffer), offset, (char *)payload, length);
            logWsStreamEvent(buffer, clientNum);
            return;
        }
        default: {
            logWsStreamEvent("wsStreamEvent.UNHANDLED EVENT: ", clientNum);
            return;
        }
    }
}

