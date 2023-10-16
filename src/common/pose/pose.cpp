#include "./pose.h"

/**
 * limit angle to pi to -pi radians (one full circle)
 */
const distance_type TWOPI = 2 * PI;
distance_type limitAngle(distance_type angle) {
    // 
    // atan2 will do this if it is available
    //
    return ATAN2(SIN(angle), COS(angle));

    //
    // this may be faster if there is no floating
    // point processor available.
    //
    // while(angle > PI) {
    //     angle -= TWOPI;
    // }
    // while(angle < -PI) {
    //     angle += TWOPI;
    // }

    return angle;
}
