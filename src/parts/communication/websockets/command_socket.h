#ifndef COMMAND_SOCKET_H
#define COMMAND_SOCKET_H

extern void wsCommandInit();
extern void wsCommandPoll();
extern bool wsSendCommandText(const char *msg, unsigned int length);

#endif // COMMAND_SOCKET_H
