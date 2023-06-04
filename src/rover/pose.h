#ifndef POSE_H
#define POSE_H

#include "../common/util/math.h"

//
// type for distance and velocity
//
typedef float distance_type;
const int sizeOfDistance = sizeof(distance_type);
#define COS(_radians) (cosf(_radians))
#define SIN(_radians) (sinf(_radians))
#define ATAN(_value) (atanf(_value))
#define ATAN2(_value1, _value2) (atan2f(_value1, _value2))
#define SQRT(_value) (sqrtf(_value))
#define ABS(_value) (abs<float>(_value))
#define SIGN(_value) (sign<float>(_value))

//
// point on 2D cartesian coordinate space
//
typedef struct Point2D {
    distance_type x;        // position on horizontal axis
    distance_type y;        // position on vertical axis
} Point2D;

//
// struct that holds the rover's
// position and direction on map
// in a right-handed coordinate frame.
//
// This represents a movement between coordinate frames.
// - translation along reference frame's x-axis
// - transtation along reference frame's y-axis
// - rotation around destination point
//
typedef struct Pose2D {
    distance_type x;        // position on horizontal axis
    distance_type y;        // position on vertical axis
    distance_type angle;    // angle in radians counter-clockwise
                            // from positive horizontal axis,
                            // so zero is pointing exactly 'right';
                            // using a right-handed coordinate frame
} Pose2D;

//
// struct that holds the rover's
// velocity components
// in a right-handed coordinate frame.
//
typedef struct Velocity2D {
    distance_type linear;   // linear velocity
    distance_type angular;  // turning rate (angular velocity)
                            // counter-clockwise in radians per second
                            // in a right-handed coordinate frame.
} Velocity2D;

extern const distance_type TWOPI;
extern distance_type limitAngle(distance_type angle);

/*
translating point (x,y) 
  
    x' = dx + x
    y' = dy + y

in vector form

    [x'] = [dx] + [x] 
    [y']   [dx] + [y]

*/

/*
rotating point (x,y) by angle a in radians:

    x' = x * cos(a) - y * sin(a)
    y' = x * sin(a) + y * cos(a)

in vector form:

    [x'] = [cos(a), -sin(a)] * [x]
    [y']   [sin(a),  cos(a)]   [y]

in matrix form:

    R = [cos(a), -sin(a)]
        [sin(a),  cos(a)]

    p = [x]
        [y]

    p' = R * p

R is an orthogonal (orthonormal) matrix
where each column is a unit vector
and each column is orthogonal to the other columns.
It's inverse is the same as it's transpose:

    R⁻¹ = Rᵀ

and since the determinant of R is one; det(R) = 1, 
then multiplying a vector by R does NOT change 
it's length.
 
The rotation matrix from coordinate frame B
to coordinate frame A is ᴬRᴮ
so rotating a vector from coordinate frame
B to coordinate frame A is:

    ᴬp = ᴬRᴮ * ᴮp

and going the other way using the inverse
rotation matrix

    ᴮp = (ᴬRᴮ)⁻¹ * ᴬp

because:

    ᴮRᴬ = (ᴬRᴮ)⁻¹

*/


/*
Homogeneous coordinates

homogeneous vector
    p = [x]
        [y]
        [1]

homogeneous translation matric
    T = [1, 0, dx]
        [0, 1, dy]
        [0, 0, 1 ]

homogeneous rotation matrix
    R = [cos(a), -sin(a), 0]
        [sin(a),  cos(a), 0]
        [  0   ,    0   , 1]



*/

/*
converting a point in frame B to
a point in frame A

We can denote a point B in frame A as a 
vector from the origin of frame A to
the point B:

    ᴬpᴮ = [ᴬxᴮ]
          [ᴬyᴮ]


A translation vector between the origin of frame A 
to the origin of frame B is the
difference between the frame origins
in a common frame. If we assume those origins
in the world coordinate frame

    ᴬtᴮ =  [ᵂxᴮ] - [ᵂxᴬ] = [ᴬxᴮ]
           [ᵂyᴮ] - [ᵂyᴬ]   [ᴬyᴮ]


given a vector in coordinate space B, we 
can add the translation vector and get
a coordinate in frame A.  

    [ᴬx] = [cos(a), -sin(a)] * [ᴮx] + [ᴬxᴮ]
    [ᴬy]   [sin(a),  cos(a)]   [ᴮy]   [ᴬyᴮ]

    ᴬp = ᴬRᴮ * ᴮp + ᴬtᴮ

Inherent in this formulation is the notion that
we can only add vectors that are in frames with the 
same or parallel axes; so the above formulation 
first rotates the point in the B frame
so it is in a coordinate frame that is parallel to
the A frame.  We then tranlate between
frame origin B and frame origin A.


*/


#endif  // POSE_H
