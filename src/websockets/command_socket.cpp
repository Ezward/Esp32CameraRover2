#include <Arduino.h>
#include <WebSocketsServer.h>
#include "command_socket.h"

#include "../string/strcopy.h"
#include "../rover/rover.h"

#define LOG_LEVEL ERROR_LEVEL
#include "../log.h"

extern TwoWheelRover rover; // declared in main.cpp


void wsCommandEvent(unsigned char clientNum, WStype_t type, unsigned char * payload, unsigned int length);
void logWsEvent(const char *event, const int id);

int commandClientId = -1;       // websocket client id for rover commands
bool isCommandSocketOn = false; // true if command socket is ready
WebSocketsServer wsCommand = WebSocketsServer(82);

void wsCommandInit() {
    wsCommand.begin();
    wsCommand.onEvent(wsCommandEvent);
}

void wsCommandPoll() {
    wsCommand.loop();
}

/**
 * send a text message to the command client
 */
void wsSendCommandText(const char *msg, unsigned int length) {
    if((isCommandSocketOn && (commandClientId >= 0)) || true) {
        wsCommand.sendTXT(commandClientId, msg, length);
    }
}

void wsCommandLogger(const char *msg, int value) {
    char buffer[128];

    int offset = strCopy(buffer, sizeof(buffer), "log(");
    offset = strCopy(buffer, sizeof(buffer), msg);
    offset = strCopyAt(buffer, sizeof(buffer), offset, " = ");
    offset = strCopyIntAt(buffer, sizeof(buffer), offset, value);
    offset = strCopyAt(buffer, sizeof(buffer), offset, ")");

    wsSendCommandText(buffer, offset);
}

/**
 * Handle a websocket event on the command socket
 */
void wsCommandEvent(unsigned char clientNum, WStype_t type, unsigned char * payload, unsigned int length) {
    switch(type) {
        case WStype_CONNECTED: {
            logWsEvent("wsCommandEvent.WS_EVT_CONNECT", clientNum);
            wsCommand.sendPing(clientNum, (uint8_t *)"ping", sizeof("ping"));
            return;
        }
        case WStype_DISCONNECTED: {
            logWsEvent("wsCommandEvent.WS_EVT_DISCONNECT", clientNum);
            if (commandClientId == clientNum) {
                commandClientId = -1;
                isCommandSocketOn = false;
            }
            return;
        } 
        case WStype_PONG: {
            logWsEvent("wsCommandEvent.WStype_PONG", clientNum);
            commandClientId = clientNum;
            isCommandSocketOn = true;
            return;
        }
        case WStype_BIN: {
            logWsEvent("wsCommandEvent.WStype_BIN", clientNum);
            return;
        }
        case WStype_TEXT: {
            // log the command
            char buffer[128];
            #ifdef LOG_LEVEL
                #if (LOG_LEVEL >= INFO_LEVEL)
                    const int offset = strCopy(buffer, sizeof(buffer), "wsCommandEvent.WStype_TEXT: ");
                    strCopySizeAt(buffer, sizeof(buffer), offset, (const char *)payload, length);
                    logWsEvent(buffer, clientNum);
                #endif
            #endif

            // submit the command for execution
            strCopySize(buffer, sizeof(buffer), (const char *)payload, (int)length);
            const SubmitCommandResult result = rover.submitTankCommand(buffer, 0);
            if(SUCCESS == result.status) {
                //
                // ack the command by sending it back
                //
                wsCommand.sendTXT(clientNum, (const char *)payload, length);
            } else {
                //
                // nack the command with status
                //
                wsCommand.sendTXT(clientNum, String("nack(") + String(result.status) + String(")"));
            }
            return;
        }
        default: {
            logWsEvent("wsCommandEvent.UNHANDLED EVENT: ", clientNum);
            return;
        }
    }
}


void logWsEvent(
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
