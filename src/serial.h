#ifndef SERIAL_H
#define SERIAL_H

//
// Source files that do NOT want serial support
// should define SERIAL_DISABLE, in which case
// the serial macros will remain defined as no-ops
//

#define SERIAL_BEGIN(_baud_)  do{/* no-op */}while(0)
#define SERIAL_DEBUG(_mode_)  do{/* no-op */}while(0)
#define SERIAL_PRINT(_msg_)   do{/* no-op */}while(0)
#define SERIAL_PRINTLN(_msg_) do{/* no-op */}while(0)

#ifndef SERIAL_DISABLE 
    #ifdef Arduino_h
        #undef SERIAL_BEGIN
        #undef SERIAL_DEBUG
        #undef SERIAL_PRINT
        #undef SERIAL_PRINTLN
        #define SERIAL_BEGIN(_baud_)  do{Serial.begin(_baud_);}while(0)
        #define SERIAL_DEBUG(_mode_)  do{Serial.setDebugOutput(_mode_);}while(0)
        #define SERIAL_PRINT(_msg_)   do{Serial.print(_msg_);}while(0)
        #define SERIAL_PRINTLN(_msg_) do{Serial.println(_msg_);}while(0)
    #endif
#endif

#endif // SERIAL_H
