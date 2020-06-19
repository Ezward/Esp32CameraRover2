#ifndef STRCOPY_H
#define STRCOPY_H

int strCopy(char *dest, int destSize, const char *source);
int strCopyBool(char *dest, int destSize, bool value);
int strCopyInt(char *dest, int destSize, int value);
int strCopyFloat(char *dest, int destSize, float value, int decimals);

#endif