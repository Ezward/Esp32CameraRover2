#ifndef UTIL_MATH_H
#define UTIL_MATH_H

/**
 * sign of number
 */
template <typename T> inline
T sign(T value) // IN : numeric value
                // RET: true if zero or positive
                //      false if negative
{ 
    return value >= 0; 
}


/**
 * Absolute of numeric value
 */
template <typename T> inline
T abs(T value)  // IN : numeric value
                // RET: absolute value
{ 
    return sign(value) ? value : -value; 
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
