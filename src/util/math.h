#ifndef UTIL_MATH_H
#define UTIL_MATH_H

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


#endif
