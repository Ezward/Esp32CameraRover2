#ifndef COMMAND_CHANNEL_H
#define COMMAND_CHANNEL_H

#include "../../common/error.h"
#ifdef USE_WEB_SOCKETS
    #include "websockets/command_socket.h"
#endif

class CommandChannel {
    bool _started = false;

public:
    bool isStarted() {
        return this->_started;
    }

    CommandChannel start() {
        if (!this->_started ) {
            #ifdef COMMAND_SOCKET_H
                wsCommandInit();
                this->_started = true;
            #endif
        }
        return *this;
    }

    CommandChannel stop() {
        if (this->_started) {
            this->_started = false;
        }
        return *this;
    }

    CommandChannel poll() {
        if (this->isStarted()) {
            #ifdef COMMAND_SOCKET_H
                wsCommandPoll();
            #endif
        }
        return *this;
    }

    ErrorCode sendText(const char *msg, unsigned int length) {
        if (this->isStarted()) {
            #ifdef COMMAND_SOCKET_H
                return wsSendCommandText(msg, length) ? SUCCESS : FAILURE;
            #endif
        }
        return SUCCESS;
    }
};

#endif // COMMAND_CHANNEL_H
