# Wheel Encoders



## Reducing Noise in Velocity Measurements

We want to run speed control and pose estimation as fast as we can so we can respond quickly to perturbations.  However, because of the low resolution of the optical encoders used in this robot, we would often get zero or one ticks in the fixed-time window used to do speed control and pose estimation.  This meant the change in velocity between frames was very often 100%; very noisy.  By adding code to require a minimum tick count before doing pose estimation or speed control, everything got much, much better.

We found that the 'noise' was really about too few ticks in a fixed-time sample, so a change of just one tick would create a large apparent change in velocity.  Think about a constant velocity where in a fixed-time sample we would get 2.5 ticks on average.  What really happens is that in one sample we will get 2 ticks, in the next 3 ticks.  If we calculate velocity using this small fixed window, then it will vary from sample to sample greatly.  But if we were to force every sample to have at least 3 ticks, then the time-window is what is varying. The system time is much higher resolution that the tick rate.  That is what reduces the noise in this case.  

There can definitely be false triggering of the encoders that can add noise, but that usually happens 'at rest' when the robot is supposed be stopped; sometimes it stops when the edge of an encoder 'slot' is in the optical path and any slight vibration of the robot can cause rising and falling edges.  That can be eliminated by disabling counting of ticks when the pwm value is zero (so when you want the robot to be stopped, don't count encoder ticks). Noise caused by loose connections can be eliminated by checking and securing all electrical connections.