# Wheel Encoders

Simply speaking, a wheel encoder produces a square wave as the wheel turns and the microcontroller can read the pulses in order to count the number of wheel turns.  The number of pulses per wheel rotation is specific to the wheel encoder and how it is arranged on the motor.    

The commonly available robot chassis uses a yellow gearbox motor and commonly ships with a encoder disk for each motor.  The encoder disk is intended to be used with a LM393 Slotted Optocoupler.  The Optocoupler emits an IR light on one side of the slot and detects the IR light on the other side of the slot.  The encoder disk is secured on the motor's output shaft.  The optocoupler is seated around the edge of the encoder disk, such that when the motor turns the encoder disk (and so the wheel) the encoder disk alternatively blocks and unblocks the IR light.  That results in a logical 0 or 1 respectively in the Optocoupler's output pin. The ESP32Cam can then detect the rising and falling edges of these pulses and keep a count of them.

This kind of encoder is is called a mono-phase encoder because it produces a single square wave.  The number of pulses per wheel revolution depends on the number of holes in the encoder disk.  16 or 20 is common is these cheaper kits.  Let's say it's 20 for illustration; this means that when the wheel makes one full turn, the microcontroller will read 20 pairs of rising/falling edges.  

We can measure the circumference (C = 2*pi*R) of the tire that is attached to the motor; this will be the distance that wheel travels in one revolution.  So the minimum distance that we can detect is one pulse; C / 20.  If we measure the time it takes to get a pulse, then we can calculate velocity.  

### Limitations
This simple kind of mono-phase optical encoder has a number of limitations.  
- 20 pulses per revolution is very low resolution and can lead to very 'noisy' velocity calculations; see how to reduce this [below](#reducing_noise_in_velocity_measurements).  
- It's not possible to determine the direction the wheel is turning just from the encoder pulses.  This can be addressed in software.
- The encoder can produce unwanted pulses when the wheel is stopped.  This happens is the and encoder hole is partially in the optocoupler slot when the rover is stopped; small movements of the rover, which might not even be detectable visually, can produce spurious pulses.  This can be mitigated in sofware.
- It's not possible to determine the absolute position of the wheel using this kind of encoder; we can count ticks since 'start' and so know how much the wheel has turned, but we cannot know in what position the wheel actually is.  This is not a limitation for our application.

### Alternative Encoder Configurations
There are other encoder configurations that address these issues.
- a quadrature encoder is a two-phase encoder; it produces two separate square waves.  The square waves are out-of-phase, but overlap.  This allows the microcontroller to determine what direction the wheel is turning.
- a quadrature encode also naturally handles unwanted pulses that can happen when the wheel stops, but is close to an 'edge'; little movements of the robot will cause pulses even though the robot does not appear to be moving.  In the case of the quadrature encoder, software will read these a series of forward and backward movements and so they naturally cancel out.
- As regards the resolution of the encoder, it is possible to just use a finer resolution encoder wheel, but this has a upper limit.  A better way is rather than put the encoder on the motor's output axle, put the encoder on the motor's main spindle.  Since we are using geared motors, the main spindle spins many, many times in order to turn output axle once.  For instance, if the gear ratio is 100:1, then the main spindle will turn 100 times for each turn of the output.  So if we have and optical encoder with 20 holes on the main spindles, we would get 20x100 = 2000 pulses per wheel rotation.  It is actually more common to have a quadrature encode with one dual-pulse per rotation, so we would get 100 pulses per wheel rotation (although we would get direction and natural rejection of unwanted pulsed from the quadrature arrangement).

Future versions of this project will try gear motors with quadrature encoders, like [these](https://www.amazon.com/Reduction-Multiple-Replacement-Velocity-Measurement/dp/B08DKJT2XF/ref=sr_1_25).  That will likely require a different chassis.


## Handling Direction and Momentum
The simple optical encoders that come with the cheaper robot chassis are 'mono-phase' encoders; they produce a single square wave.  It is not possible to determine if the wheel is moving forward or backwards simply by looking at the pulses.  However, since we are controlling the motors, so we know which direction we told them to turn.  So each wheel keeps a value of -1, 0, or 1 to indicate if the wheel is moving backwards, is stopped or is moving forwards respectively.  When a pulse is emitted by the encoder, this value is added to the 'count' of pulses.  So if we told the motor go in reverse, then -1 will be added, thus decrementing the count.  If we told the motor to go forward, then 1 will be added, incrementing the count.  Finally, if we told the motor to stop, then zero will be added; thus we do not change the count when we've told the motor to stop.  

This last part, where we add zero when we believe the rover should be stopped, also handles rejection of the spurious pulses we can get if the encoder wheel stops with a hole 1/2 in and out of the optocoupler slot.  However, this causes another small problem; the rover does not immediately stop when we tell the motors to stop; there is some momentum that make the wheel turn a little more.  The same thing can happen when reversing direction; it takes a small time for the rover to stop moving in it's original direction and start to move in the opposite direction.  This frameworks adds code that makes the encoder continue to integrate in the original direction for a short time after being stopped or reversed. You can change this for your rover by editing config.h.

```
const unsigned int CONTROL_SETTLE_MS = 20;     // number of milliseconds after changing direction that we
                                               // we continue to integrate encoder ticks in the prior direction
                                               // in order to handle inertia.
```





## Reducing Noise in Velocity Measurements

We want to run speed control and pose estimation as fast as we can so we can respond quickly to perturbations.  However, because of the low resolution of the optical encoders used in this robot, we would often get zero or one ticks in the fixed-time window used to do speed control and pose estimation.  This meant the change in velocity between frames was very often 100%; very noisy.  By adding code to require a minimum tick count before doing pose estimation or speed control, everything got much, much better.

We found that the 'noise' was really about too few ticks in a fixed-time sample, so a change of just one tick would create a large apparent change in velocity.  Think about a constant velocity where in a fixed-time sample we would get 2.5 ticks on average.  What really happens is that in one sample we will get 2 ticks, in the next 3 ticks.  If we calculate velocity using this small fixed window, then it will vary from sample to sample greatly.  But if we were to force every sample to have at least 3 ticks, then the time-window is what is varying. The system time is much higher resolution that the tick rate.  That is what reduces the noise in this case.  

There can be false triggering of the encoders that can add noise, but that usually happens 'at rest' when the robot is supposed be stopped; sometimes it stops when the edge of an encoder 'slot' is in the optical path and any slight vibration of the robot can cause rising and falling edges.  That can be eliminated by disabling counting of ticks when the pwm value is zero (so when you want the robot to be stopped, don't count encoder ticks). Noise caused by loose connections can be eliminated by checking and securing all electrical connections.
