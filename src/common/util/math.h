#ifndef UTIL_MATH_H
#define UTIL_MATH_H

#ifndef PI  
    #define PI (3.1415926535897932384626433)
#endif

/**
 * sign of number
 */
template <typename T> inline
int sign(T value)   // IN : numeric value
                    // RET: 1 if zero or positive
                    //      -1 if negative
{ 
    return value >= 0 ? 1 : -1; 
}


/**
 * Absolute of numeric value
 */
template <typename T> inline
T abs(T value)  // IN : numeric value
                // RET: absolute value
{ 
    return (value >= 0) ? value : -value; 
}

/**
 * Increment a value without rolling over maximum
 */
template <typename T> inline
T inc(
    T value,        // IN : numeric value to increment
    T increment,    // IN : the amount to add to value
    T maximum)      // IN : the maximum value
                    // RET: incremented value <= maximum
{ 
    return (value < (maximum - increment) ? (value + increment) : maximum); 
}

/**
 * Decrement a value without rolling under minimum
 */
template <typename T> inline
T dec(
    T value,        // IN : numeric value to increment
    T decrement,    // IN : the amount to subtract from value
    T minimum)      // IN : the minimum value
                    // RET: decremented value >= minimum
{ 
    return (value > (minimum + decrement) ? (value - decrement) : minimum); 
}


/**
 * Constrain numeric value between a min and max inclusive
 */
template <typename T> inline
T bound(T value,    // IN : value to constrain
        T min,      // IN : minimum
        T max)      // IN : maximum
                    // RET: number between min and max inclusive 
{
    return (value <= min) ? min : (value >= max) ? max : value;
}

/**
 * Map a value from one unit to another unit.
 */
template <typename T> inline
T map(T value,      // IN : value to map in 'from' units
      T fromMin,    // IN : minimum 'from' value
      T fromMax,    // IN : maximum 'from' value
      T toMin,      // IN : minimum 'to' value
      T toMax)      // IN : maximum 'to' value
{
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}

template <typename T> inline
int compareTo(T value,      // IN : value to compare
              T toValue,    // IN : value to compare with tolerance
              T tolerance)  // IN : non-negative tolerance
                            // RET: 1 if value > toValue + tolerance
                            //      -1 if value < toValue - tolerance
                            //      otherwise zero
{
    if ((toValue - value) > tolerance) return - 1;
    if ((value - toValue) > tolerance) return 1;
    return 0;
}

/**
 * Determine if a point falls within a circle
 * (inclusive of boundary)
 */
template <typename T> inline
bool pointInCircle(
    T x,        // IN : horizontal value to check
    T y,        // IN : vertical value to check
    T centerX,  // IN : circle's central horizontal value
    T centerY,  // IN : circle's central vertical value
    T radius)   // IN : radius of circle
                // RET: true if point is on or in circle
                //      false if point falls outside circle
{
    const T deltaX = x - centerX;
    const T deltaY = y - centerY;
    return (deltaX * deltaX + deltaY * deltaY) <= (radius * radius);
}

#endif
