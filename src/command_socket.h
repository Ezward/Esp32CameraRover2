#ifndef COMMAND_SOCKET_H
#define COMMAND_SOCKET_H

extern void wsCommandInit();
extern void wsCommandPoll();
extern void wsSendCommandText(const char *msg, unsigned int length);
extern void wsCommandLogger(const char *msg, int value);

#endif // COMMAND_SOCKET_H
