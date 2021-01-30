## TODO
These are somewhat ordered, but priorities can change.  The overall goals are: 

1. FPV Rover with keyboard and web UI control. 
   - switch to ESPAsyncWebServer, implement minimal control via /rover endpoint (no UI yet).
   - Add UI to html to control the rover, so it can be controlled from devices that don't have a keyboard (like a phone).
   - Implement streaming video to browser using ~~ESPAsyncWebServer streaming response~~ websockets.
2. Enhanced FPV Rover with better speed and turn control and game controller input for a more natural user experience.
3. Go to goal and path following using dead reckoning.
4. Autonomous lane following.
5. Object recognition and collision avoidance.

x = completed
+ = in progress

- [x] Change to a more performant web server that will allow simultanous streaming of images and processing of rover commands.
- [x] Implement websocket protocol and serve images over websocket (may just be part of improving performance, but down the road we want to also use it so send commands to rover).
- [x] Implement websocket protocol to send commands from browser to rover (rather than HTTP GET api; this forces ordering of commands).
- [x] Implement PWM control for motor speed (and modify UI to support this).
- [x] Implement game controller input (via browser's game control api).
- [ ] Implement authentication so only one person can be driving, but any number of people can be viewing.
- [x] Implement wheel encoders for measuring speed and distance travelled.  
- [x] Implement web UI for calibration of wheel encoders, RPM, distance (required wheel encodes)
- [x] Implement PID algorithm to precisely control speed of motors (and so allow for any turning radius) using wheel encoders (requires calibration of wheel encoders).  Rover should drive in straight line when using the 'Forward' turtle command.  NOTE: Implemented as a feed-forward constant controller rather than a PID controller.
- [x] Implement motor telemetry from rover to web client using websockets (for each wheel: pwm, target speed, current speed, total distance, time in ms) - position and pose TBD, wheel values are done.
- [x] Implement position and pose estimation based on dead reckoning using encoder values.
- [x] Implement pose telemetry from rover to web client using websockets.
- [x] Graph telemetry in web client; 
      - [x] wheel telemetry tab has time as x-axis and dual y-axis; pwm and speed
      - [x] pose and position as (x, y) position of rover and arrow at (x,y) position to show pose.
- [ ] Save settings to flash and load on restart
      - [ ] either send settings to client on connection AND/OR allow client to ask for settings.
- [x] Implement telemetry reset to we can start from zero without hard-resetting the ESP32Cam.
- [ ] Implement commands to allow client to turn on/off or set rate of telemetry based on time.  So ask for zero telemetry, or telemetry every n milliseconds or all telemetry.  Do this for "tel" and "pos".  
  - Modify the TelemetryViewManager to use this to reduce telemetry to the deactivated chart.
  - we may also want to reduce telemetry while streaming video, in order to reduce bandwidth used.
- [ ] Implement commands to turn on/off "set" telemetry.  This is really just needed for debugging.
- [x] Implement UI and command to reset telemetry so we can start from origin without rebooting the rover and reloading the UI.
- [x] Throttle joystick commands such that we don't create a huge queue of joystick commands; 
      - [x] we can check if a command is 'sending' and only enqueue if not sending.
      - [x] we can check if there is already a movement command in the queue and replace it with the latest command so there is only one movement command in the queue.
- [ ] Implement turning arc (radius around instantaneous center of curvature) turtle command and speed control.  Requires slider for turning radius input.
- [ ] Re-implement joystick control to choose a speed (linear velocity) and an turning rate (angular velocity) and use those to calculate the wheel velocities.  Clamp the angular velocity to create some reasonable max turning angle that makes it turn more like a regular car.
- [ ] Add realtime speed/pwm control while driving in turtle mode; add a change handler to the slide and respond to changes in speed slider by sending changes to rover.  
- [ ] Implement PS3 Game controller via bluetooth directly to ESP32 to reduce input latency (necessary for capturing good data for machine learning).
- [ ] Implement CV lane following autopilot running on ESP32 (for Donkeycar kind of track).
- [ ] Implement Neural Network autopilot in TensorflowJS Micro lane following (like DonkeyCar).
- [ ] Implement object detection in browser using TensorFlow.js.  In particular, stop signs, traffic lights, pedestrians and other rovers such that the rover can obey signs and avoid collisions.
- [ ] Implement Neural Network autopilot in Tensorflow Lite Micro for ESP32 for lane following (like DonkeyCar).
- [x] Implement go to goal line follower.  Requires lateral control (line follow) and longitudinal control (stop at goal).  See PurePursuit algorithm.
- [ ] Implement waypoint recorder and associated UI so we can record and playback a path that has been driven ((requires lateral and longitudinal control)).
- [ ] Implement map and path planning such that rover can use autonomous mode to travel from a specified location to another on the map.  Think simulating a 4 block neighborhood with a perimeter road, 4 3-way intersections and a central 4 way intersections and at least one section of a gradual curve (rather than 90 degrees) so we can test smooth turning.
- [ ] Combine path planning, autonomy, obstacle detection and collision avoidance to implment an autonomous package delivery vehicle in a simulated neighbor hood.
- [ ] Implement a version of hardware support that uses a PCA9885 PWM board over I2C to control motor speed.  This only adds $3 to BOM, but frees up lots of pins so we get back serial output from rover even with wheel encoders and we can add other I2C peripherals, like an IMU to improve dead reconning.  Could also add a OLED screen to output the ip address of the rover at startup and other status while running.  So for $3 it adds a lot of flexibility.
- [ ] create a simulator that can serve the client application and simulate the motors and wheel encoders and can server the computer's webcam or a static image for the video stream.  Simulator will need mock wheel and mock encoder so it can simulate wheel speeds based on pwm setting send to the wheel and speed calibration entered in use and sent as commands to the rover.

