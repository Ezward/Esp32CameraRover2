#include <stdio.h>
#include "strcopy.h"

#define MIN(_a, _b) (((_a) < (_b)) ? (_a) : (_b))

//
// c-string safe string copy
//

int strCopy(
  char *dest,         // IN : non-null point to buffer destSize chars long
                      // OUT: null terminated string < destSize in length
  int destSize,       // IN : size of buffer in chars
  const char *source) // IN : null terminated string to copy
                      // RET: index of null terminator 
                      //      (number of chars copied not including terminator),
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
      return copySize;
    }
    return 0;
  }
  return -1;
}

//
// safe copy string at given index
//
int strCopyAt(
  char *dest,         // IN : non-null point to buffer destSize chars long
                      // OUT: null terminated string < destSize in length
  int destSize,       // IN : size of buffer in chars
  int destIndex,      // IN : index into dest to start copy
  const char *source) // IN : null terminated string to copy
                      // RET: index of null terminator
                      //      or -1 if source or dest is null
                      //      or -1 if destIndex < 0 or > destSize
{
  if(NULL != source && NULL != dest && destIndex >= 0 && destSize > destIndex) {
      const int terminatorIndex = strCopy(dest + destIndex, destSize - destIndex, source);
      if (terminatorIndex >= 0) {
          return terminatorIndex + destIndex;
      }
  }
  return -1;
}

/*
** safe copy string given maximum size
*/
int strCopySize(
  char *dest,           // IN : non-null point to buffer destSize chars long
                        // OUT: null terminated string < destSize in length
  const int destSize,   // IN : size of buffer in chars
  const char *source,   // IN : null terminated string to copy
  const int sourceSize) // IN : size of source buffer
                        // RET: index of null terminator 
                        //      (number of chars copied not including terminator),
                        //      or -1 if source or dest is null
{
  if(NULL != dest && NULL != source) {
    if(destSize > 0) {
      const int copySize = destSize - 1;
      int i;
      for(i = 0; (i < copySize) && (i < sourceSize); i += 1) {
        if('\0' == (dest[i] = source[i])) {
          return i;
        }
      }
      dest[i] = '\0';
      return i;
    }
    return 0;
  }
  return -1;
}


//
// safe copy string of given size at given index
//
int strCopySizeAt(
  char *dest,           // IN : non-null point to buffer destSize chars long
                        // OUT: null terminated string < destSize in length
  const int destSize,   // IN : size of buffer in chars
  const int destIndex,  // IN : index into dest to start copy
  const char *source,   // IN : null terminated string to copy
  const int sourceSize) // IN : size of source buffer
                        // RET: index of null terminator
                        //      or -1 if source or dest is null
                        //      or -1 if destIndex < 0 or > destSize
{
  if(NULL != source && NULL != dest && destIndex >= 0 && destSize > destIndex) {
      const int terminatorIndex = strCopySize(dest + destIndex, destSize - destIndex, source, sourceSize);
      if (terminatorIndex >= 0) {
          return terminatorIndex + destIndex;
      }
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
                // RET: index of null terminator 
                //      (number of chars copied not including terminator),
                //      or -1 if source or dest is null
{
  return strCopy(dest, destSize, value ? "true" : "false");
}


//
// safe copy "true" or "false" at given index
//
int strCopyBoolAt(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  int destIndex,// IN : index into dest to start copy
  bool value)   // IN : boolean value to print
                // RET: index of null terminator
                //      or -1 if source or dest is null
                //      or -1 if destIndex < 0 or destIndex > destSize
{
  if(NULL != dest && destIndex >= 0 && destSize > destIndex) {
      const int terminatorIndex = strCopyBool(dest + destIndex, destSize - destIndex, value);
      if (terminatorIndex >= 0) {
          return terminatorIndex + destIndex;
      }
  }
  return -1;
}


//
// safe copy integer number
//
int strCopyInt(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  int value)    // IN : signed integer number to print
                // RET: index of null terminator 
                //      (number of chars copied not including terminator),
                //      or -1 if source or dest is null
{
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%d", value);

  return strCopy(dest, MIN(destSize, sizeof(buffer)), buffer);
}


//
// safe copy integer number at given index
//
int strCopyIntAt(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  int destIndex,// IN : index into dest to start copy
  int value)    // IN : signed integer number to print
                // RET: index of null terminator
                //      or -1 if source or dest is null
                //      or -1 if destIndex < 0 or destIndex > destSize
{
  if(NULL != dest && destIndex >= 0 && destSize > destIndex) {
      const int terminatorIndex = strCopyInt(dest + destIndex, destSize - destIndex, value);
      if (terminatorIndex >= 0) {
          return terminatorIndex + destIndex;
      }
  }
  return -1;
}


//
// safe copy long integer number
//
int strCopyLong(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  long value)   // IN : signed long integer number to print
                // RET: index of null terminator 
                //      (number of chars copied not including terminator),
                //      or -1 if source or dest is null
{
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%ld", value);

  return strCopy(dest, MIN(destSize, sizeof(buffer)), buffer);
}


//
// safe copy long integer number at given index
//
int strCopyLongAt(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  int destIndex,// IN : index into dest to start copy
  long value)   // IN : signed long integer number to print
                // RET: index of null terminator
                //      or -1 if source or dest is null
                //      or -1 if destIndex < 0 or destIndex > destSize
{
  if(NULL != dest && destIndex >= 0 && destSize > destIndex) {
      const int terminatorIndex = strCopyLong(dest + destIndex, destSize - destIndex, value);
      if (terminatorIndex >= 0) {
          return terminatorIndex + destIndex;
      }
  }
  return -1;
}

//
// safe copy unsigned long integer number
//
int strCopyULong(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  unsigned long value)   // IN : unsigned long integer number to print
                // RET: index of null terminator 
                //      (number of chars copied not including terminator),
                //      or -1 if source or dest is null
{
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%lu", value);

  return strCopy(dest, MIN(destSize, sizeof(buffer)), buffer);
}


//
// safe copy unsigned long integer number at given index
//
int strCopyULongAt(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  int destIndex,// IN : index into dest to start copy
  unsigned long value)   // IN : unsigned long integer number to print
                // RET: index of null terminator
                //      or -1 if source or dest is null
                //      or -1 if destIndex < 0 or destIndex > destSize
{
  if(NULL != dest && destIndex >= 0 && destSize > destIndex) {
      const int terminatorIndex = strCopyULong(dest + destIndex, destSize - destIndex, value);
      if (terminatorIndex >= 0) {
          return terminatorIndex + destIndex;
      }
  }
  return -1;
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
// safe copy floating point number
//
int strCopyFloatAt(
  char *dest,   // IN : non-null point to buffer destSize chars long
                // OUT: null terminated string < destSize in length
  int destSize, // IN : size of buffer in chars
  int destIndex,// IN : index into dest to start copy
  float value,  // IN : floating point number to print
  int decimals) // IN : number of decimal places
                // RET: index of null terminator
                //      or -1 if source or dest is null
                //      or -1 if destIndex < 0 or destIndex > destSize
{
  if(NULL != dest && destIndex >= 0 && destSize > destIndex) {
      const int terminatorIndex = strCopyFloat(dest + destIndex, destSize - destIndex, value, decimals);
      if (terminatorIndex >= 0) {
          return terminatorIndex + destIndex;
      }
  }
  return -1;
}

