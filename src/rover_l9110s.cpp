#include <Arduino.h>
#include "rover.h"

/******************************************************/
/****************rover control ************************/
/******************************************************/
byte speed = 128;

int AIA_PIN = -1;
int AIB_PIN = -1;
int BIA_PIN = -1;
int BIB_PIN = -1;

//
// set the rover pins
//
void roverInit(int a1, int a2, int b1, int b2)
{
    AIA_PIN = a1;
    AIB_PIN = a2;
    BIA_PIN = b1;
    BIB_PIN = b2;

    pinMode(AIA_PIN, OUTPUT);
    pinMode(AIB_PIN, OUTPUT);
    pinMode(BIA_PIN, OUTPUT);
    pinMode(BIB_PIN, OUTPUT);
}

int roverCommand(
    const char *directionParam, // IN : direction as a string; "forward",
                                //      "reverse", "left", "right", or "stop"
    const char *speedParam)     // IN : speed as an integer string, "0".."255"
                                //      where "0" is stop,  "255" is full speed
                                // RET: 0 for SUCCESS, non-zero for error code
{
    int speed = roverGetSpeed();
    char *direction = "";

    //
    // validate speed param
    //
    if (NULL != speedParam && strlen(speedParam) > 0)
    {
        int speedValue = atoi(speedParam);
        if ((speedValue >= 0) && (speedValue <= 255))
        {
            speed = speedValue;
        }
        else
        {
            return FAILURE;
        }
    }

    //
    // validate direction param
    //
    if (NULL != directionParam && strlen(directionParam) > 0)
    {
        if (0 == strcmp(directionParam, "stop"))
        {
            roverStop();
        }
        else if (0 == strcmp(directionParam, "forward"))
        {
            roverSetSpeed(speed);
            roverForward();
        }
        else if (0 == strcmp(directionParam, "reverse"))
        {
            roverSetSpeed(speed);
            roverReverse();
        }
        else if (0 == strcmp(directionParam, "left"))
        {
            roverSetSpeed(speed);
            roverTurnLeft();
        }
        else if (0 == strcmp(directionParam, "right"))
        {
            roverSetSpeed(speed);
            roverTurnRight();
        }
        else
        {
            return FAILURE;
        }
    }

    return SUCCESS;
}

void roverSetSpeed(byte inSpeed)
{
    speed = inSpeed;
}
byte roverGetSpeed()
{
    return speed;
}

void roverStop()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, LOW);
    digitalWrite(AIB_PIN, LOW);
    digitalWrite(BIA_PIN, LOW);
    digitalWrite(BIB_PIN, LOW);
}
void roverForward()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, HIGH);
    digitalWrite(AIB_PIN, LOW);
    digitalWrite(BIA_PIN, LOW);
    digitalWrite(BIB_PIN, HIGH);
}
void roverReverse()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, LOW);
    digitalWrite(AIB_PIN, HIGH);
    digitalWrite(BIA_PIN, HIGH);
    digitalWrite(BIB_PIN, LOW);
}
void roverTurnRight()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, HIGH);
    digitalWrite(AIB_PIN, LOW);
    digitalWrite(BIA_PIN, HIGH);
    digitalWrite(BIB_PIN, LOW);
}
void roverTurnLeft()
{
    if (-1 == AIA_PIN)
        return;

    digitalWrite(AIA_PIN, LOW);
    digitalWrite(AIB_PIN, HIGH);
    digitalWrite(BIA_PIN, LOW);
    digitalWrite(BIB_PIN, HIGH);
}
