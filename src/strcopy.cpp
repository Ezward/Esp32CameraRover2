#include <stdio.h>
#include "strcopy.h"

#define MIN(_a, _b) (((_a) < (_b)) ? (_a) : (_b))

//
// safe string copy
//
int strCopy(
  char *dest,         // IN : non-null point to buffer destSize chars long
                      // OUT: null terminated string < destSize in length
  int destSize,       // IN : size of buffer in chars
  const char *source) // IN : null terminated string to copy
                      // RET: number of chars copied NOT including null terminator
                      //      or -1 if source or dest is null
{
  if(NULL != dest && NULL != source) {
    if(destSize > 0) {
      const int copySize = destSize - 1;
      for(int i = 0; i < copySize; i += 1) {
        if('\0' == (dest[i] = source[i])) {
          return i;
        }
      }
      dest[copySize] = '\0';
      return destSize;
    }
    return 0;
  }
  return -1;
}


//
// safe copy "true" or "false"
//
int strCopyBool(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  bool value)   // IN : boolean value to print
                // RET: number of chars copied including null terminator
                //      or -1 if dest is null
{
  return strCopy(dest, destSize, value ? "true" : "false");
}


//
// safe copy integer number
//
int strCopyInt(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  int value)    // IN : signed integer number to print
                // RET: number of chars copied including null terminator
                //      or -1 if dest is null
{
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%d", value);

  return strCopy(dest, MIN(destSize, sizeof(buffer)), buffer);
}


//
// safe copy floating point number
//
int strCopyFloat(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  float value,  // IN : floating point number to print
  int decimals) // IN : number of decimal places
                // RET: number of chars copied including null terminator
                //      or -1 if dest is null
{
  char buffer[48];
  snprintf(buffer, sizeof(buffer), "%.*f", decimals, value);

  return strCopy(dest, MIN(destSize, sizeof(buffer)), buffer);
}

//
// safe copy long integer number
//
int strCopyLong(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  long value)   // IN : signed long integer number to print
                // RET: number of chars copied including null terminator
                //      or -1 if dest is null
{
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%ld", value);

  return strCopy(dest, MIN(destSize, sizeof(buffer)), buffer);
}
