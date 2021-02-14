## Rover Calibration
We want to figure out 3 things for each wheel
- The stall value; the fraction of maximum power below which the motor stalls (so this is the minimal power needed to make the motor move).
- The minimum speed; this is the speed at the stall value.
- The maximum speed; this is the speed at full power.

We can observe these values using Turtle control mode.

- Note: You might want to practice this without having to chase around the rover by elevating the rover so the wheels are not touching the ground or rubbing against anything.  That will not yield correct values for running on a floor or carpet, but is is useful for trying out the rover without running around after it

- Here is a video describing the [EzRover calibration](https://youtu.be/ciDCUUx8MXI) process.

- Restart the rover and use a web browser to open the client application.  This should open the application is it's default, uninitialized state.  Specifically, the motor stall values will be at zero, speed control will be turned off and no minimum or maximum speeds are configured.
- Make sure the 'Speed' panel is selected in Rover Telemetry section, the 'Turtle' panel is chosen in the Rover Control section and the 'Motor' panel is chose in the Rover Calibration section.
- First we want to find the stall value.  We can use a 'binary' search kind of algorithm.  In the Turtle panel, set the Speed value to 0.5; the value halfway between stopped and full power.  Now select the 'Forward' button and allow the motors to run for 5 or 10 seconds.  If both wheels move freely for the whole time, then we want to try the value at 0.25; if the wheels to not move, then we want to try the value at 0.75.  We can proceed this way, selecting values midway between known outcomes until we find a value where both wheels move freely, but below which one or both do not move freely.  At point we know know the stall value for each motor _and_ the minimum speed for each motor.  The stall value is smallest 'Speed' value where both motors run freely.  You should write that value down; later we will enter this for 'Left Stall' and 'Right Stall' in the 'Motor' panel of the Rover Calibration section.  You should also write down the left and right minimum speeds; they will be displayed below the telemetry graph in the 'Speed' panel when you have run the motors at the stall value.
- Now we want to find the maximum speed of each motor.  Move the 'Speed' slider all the way to the right so it is set a 1; this is full power.  Now select the 'Forward' button and drive the motors for 5 to 10 seconds.  You can then read the speed of the left and right motors from the 'Speed' panel in the Rover Telemetry section.  Write those down.  Now you might have something that looks like this;  


|        |left|right|
|--------|----|-----|
|stall   |0.75| 0.75|
|minspeed|27.2| 24.3|
|maxspeed|57.7| 54.9|


- Enter the stall values in the 'Motor' panel of the Rover Calibration section.
- Enter the min speed and max speed values in the 'Speed' panel of the Rover Calibration section and set the 'Speed Control' radio button to on. When you select that radio button to on, the speed configuration will be send to the rover and now, when you use the Turtle controls, the 'Speed' slider will choose speeds between min and max, rather that a fraction of overall power.  Further, these values will be used by the 'Goto' control as it moves to the chosen location.