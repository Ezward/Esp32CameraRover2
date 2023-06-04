#ifndef LOG_H
#define LOG_H

//
// Each source file that wants to use the logging mechanism
// should define LOG_LEVEL as one of these 4 values.
// If no logging is to be done, LOG_LEVEL should NOT defined
//
#define DEBUG_LEVEL (0)
#define INFO_LEVEL  (1)
#define WARN_LEVEL  (2)
#define ERROR_LEVEL (3)


#define LOG_ERROR(_msg_)   do{/* no-op */}while(0)
#define LOG_WARNING(_msg_) do{/* no-op */}while(0)
#define LOG_INFO(_msg_)    do{/* no-op */}while(0)
#define LOG_DEBUG(_msg_)   do{/* no-op */}while(0)


#ifdef LOG_LEVEL
    #ifdef Arduino_h
        #ifndef LOG_MESSAGE
            #include "serial.h"
            #define LOG_MESSAGE(_prefix_, _msg_) do{SERIAL_PRINT(_prefix_); SERIAL_PRINTLN(_msg_);}while(0)
        #endif
    #endif  
    #ifdef LOG_MESSAGE
        #if (LOG_LEVEL <= ERROR_LEVEL)
            #undef LOG_ERROR
            #define LOG_ERROR(_msg_) LOG_MESSAGE("ERROR: ", _msg_)
        #endif
        #if (LOG_LEVEL <= WARN_LEVEL)
            #undef LOG_WARNING
            #define LOG_WARNING(_msg_) LOG_MESSAGE("WARNING: ", _msg_)
        #endif
        #if (LOG_LEVEL <= INFO_LEVEL)
            #undef LOG_INFO
            #define LOG_INFO(_msg_) LOG_MESSAGE("INFO: ", _msg_)
        #endif
        #if (LOG_LEVEL <= DEBUG_LEVEL)
            #undef LOG_DEBUG
            #define LOG_DEBUG(_msg_) LOG_MESSAGE("DEBUG: ", _msg_)
        #endif
    #endif
#endif


#endif // LOG_H