#ifndef STRCOPY_H
#define STRCOPY_H

int strCopy(char *dest, int destSize, const char *source);
int strCopyBool(char *dest, int destSize, bool value);
int strCopyInt(char *dest, int destSize, int value);
int strCopyLong(char *dest, int destSize, long value);
int strCopyULong(char *dest, int destSize, unsigned long value);
int strCopyFloat(char *dest, int destSize, float value, int decimals);

int strCopyAt(char *dest, int destSize, int destIndex, const char *source);
int strCopyBoolAt(char *dest, int destSize, int destIndex, bool value);
int strCopyIntAt(char *dest, int destSize, int destIndex, int value);
int strCopyLongAt( char *dest, int destSize, int destIndex, long value);
int strCopyULongAt( char *dest, int destSize, int destIndex, unsigned long value);
int strCopyFloatAt(char *dest, int destSize, int destIndex, float value, int decimals);

#endif