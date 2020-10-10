# Esp32CameraRover2

This sketch uses an ESP32 Cam, an L9110S dc motor controller and a commonly available Robot Car chassis to create a First-Person-View (FPV) robot that can be driven from any web browser.  The goal is to create a very inexpensive, easy to build robot capable of
- Remote control using a First Person View and game controller
- Downloadable program control using Logo or other turtle-syntax
- Autonomous navigation using a combination of CV and Neural networks.

So two important requirements are:
- The robot must be inexpensive
- The robot must be easy and safe to build

The capabilities listed above then create some other requirements;
- The robot must have it's own battery so it can operate remotely.
- The robot must have a camera to enable a first persion view for the remote operator and as a sensor for autonomous navigation.
- The robot must have some form of low-latency remote communication to enable effective remote control from a computer or cell phone.
- The robot must have odometry (using wheel encoders) for precise control of speed and distance.

The chassis for the robot is a very commonly available kit that includes two dc motors, two wheels, a caster wheel and a clear plastic chassis/platform to mount everything on.  Construction is very simple.  The only soldering required is to attach 2 wires to each of the 2 motors and there are even ways of avoiding that.  

The other nice thing about these kits is that they come with wheel encoder disks; we can add two optocouplers to enable precise odometry for the robot, which is important in a number of scenarios.

The Esp32 Cam was chosen because it is a very inexpensive microcontroller that includes a camera, bluetooth and wifi.  It also comes with the headers pre-soldered, which eliminates the need for a lot of soldering.  This is nice for beginners and for scenerios where a hot soldering iron is undersirable.  

Wiring of the robot is done using inexpensive and easy to find jumper wires with pre-crimped dupont connectors.  For the most part, we have chosen components that have pre-installed headers so we can just connect to them using these pre-fabricated jumper wires.  This makes wiring primarily solderless.  The possible exceptions to this are the dc motors.  Each motor has two terminals that need wires connected. It turns out that soldering lead wires to such terminals is really easy, even if this is your first time using a soldering iron.  However, there are alternatives



## Status
- The [first iteration](https://github.com/Ezward/Esp32CameraRover) used the canonical Esp32CameraWebServer example sketch as its basis and added the rover functionality to it.  However, the results were disappointing.  This iteration replaces the default polled webserver with ESPAsyncWebService, which is a more capable webserver that can handle multiple requests simulateously.  Also the api is much, much nicer than the default esp webserver.  We also move from the Arduino IDE to the PlatformIO IDE, which adds lots of IDE goodness, especially preview of class api's and function arguments, which makes both understanding and writing code much more efficient.  You need to install more stuff; you still need the lastest Arduino IDE, because in comes with the Ardunio SDK.  You also need to install Microsoft Visual Studio, since PlatformIO is a plugin for MSV.  Follow the PlatformIO instructions for installation into Microsoft Visual Studio.  You can then close this repo and open it in PlatformIO.
- At this point the basic rover commands are implemented in the web server and the client html is served, so the car can be controlled from the browser machine's keyboard.  This is the same as the first iteration.  We still seem to get pretty slow response to commands; the rover commands seem to take at least a second before they return and they often fail to return a status code, which causes problems for the client.  I think the thing to do there is to place commands in a queue and have a separate task (ESP32 FreeRTOS task) to pull them from the queue and execute them.  That way web server is not in the middle of handling a request when we are writing to the hardware gpio.  This may be enough, but we should also think about whether we want to move to websockets for commands, because we build the connection once and leave it open, it may reduce the overhead associated with open and closing connections for each request.
  - The code has been refactored to change the /rover handler to add the command to a queue rather than execute it directly, before the response is sent.  Now the code adds the command to a command queue, then returns from the handler.  A FreeRTOS task is used to process the commands in the command queue, outside of the request handler and independantly from other code.  The queue is small, since we expect they will come in slowly and we expect to be able to execute them quickly.  The queue is a circular queue with a byte for head and tail indices.  The code is organized, assuming a single producer and a single consumer, to work without any semaphores.
  - The issue with slow commands seems to be due to brownouts in the ESP32.  The same 5v supply was being used for the ESP32 and the two DC Motors (via the L9110s). The battery supplies 3A, but the peak power draw of the motors still was a problem.  That is solved by providing a separate power supply for the CPU and another for the L9110s and motors.  With the queue change and the power change, the code now responds to commands better; it feels like 200ms or 300ms latency.  I think that we might be able to improve this if we use a websocket connection between the client and the ESP32.  That would also provide guaranteed ordering of commands, which current design does not, although it is unlikely to be a real proble with human input it may be a problem with an autopilot.  Also, a websocket connection would allow the ESP3 to push information back to the client; this would also be used to provide telemetry to the user (possibly including the video).
  - I confirmed the brown-out issue.  If I use two separate 5v USB batteries, one for the ESP and another for the L9110S then I do not have the control problem.  When I revert to a single power supply (even a wall plug), I get the brown-outs.  It's possible I could fix this with a capacitor or two to make sure there is no instantaneous power sag when the motors kick-in. I've see this done on RCs.  I like that idea because it would allow the us of a usb battery.  If that does not work, then moving to a 7.2v NiMH with a splitter and a 5v ubec could work (basically what I do on donkeycar).  The UBEC already has capacitors, so it seems to deliver stable power.  These are cheap, but require soldering a connector.
- Added code to capture a single frame on the /image endpoint.  Also added all the code to handle the control panel so image properties can be configured (/control and /status endpoints).  The plan for 'video' is to simply continuously update the image; in the html/javascript we will add an onload handler which will update the image url again with a new cache buster, forcing a new image to be requested from the server continuously.  So we won't both with a 'stream' based on a multipart return; that was basically doing something similar; when the web client acked the last image it would return a new one.  So I expect this method to be about as good and much simpler to implement.
- Updated web app to use code to continuously hit the /capture endpoint in order to simulate streaming.  This method makes it easy, but it does cause significant lag in the images because building the connection takes >150ms.  I can see why people have used websockets; once the connection is made, it is kept open so that source of latency is elimited.  Further, if I were to put the image capture code in an FreeRTOS background task, then just return the most recent frame, I could probably get the latency way down.  In anycase, at this point I was able to try driving the robot remotely and it 'works'.  My prototype is back-heavy and so there was not enough traction for drive wheels, which cause a lot of control issues because of expensive wheel slip.  But the software all works; I can 'stream' images while driving the robot.  (Again, it is currently necesary to have separate power supplies for ESP and L9110S to avoid brownouts and reboots).
- Beyond the wheel slip issue, the basic control structure is not good; it simply has forward, backward, spin right, spin left with a stop required between each command.  Further, because if the latency of each http request (again, connection is >150ms), the duration of a command is very hard to control.  Again a websocket protocol would minimize this latency.  That won't be sufficient I think; we really want to control the motor with PWM, so we can control speed, then we want to use a game controller's analog joysticks to get continous values to we can control this thing a lot more like an RC (so either bluetooth or experiment with HTML5 Game contoller api).
- This this iteration is using simple LOW/HIGH output to control the motors, so speed is zero or 100%.  We will attempt to use PWM again later.
- This this iteration does not yet incorporate the optocouplers so actual speed is unknown.

### Tags
- **v0.2**
  - Serve gzipped html/css/javascript page.
  - Control rover with keyboard.
  - /rover handler adds command to a queue and returns immediately to caller.
  - FreeRTOS background task is used to process the command queue.
- **v0.3**
  - /capture to get a single image based on the current camera configuration
  - /control to set the camera configuration
  - /status to get the camera configuration
  - /health to get the health of the server
  - /stream returns a 501 Not Implemented
  - ported the camera properties code from the canonical Esp32CameraWebServer sample and adapted it to the ESPAsyncWebServer.
    - TODO: need to port the code that calculates the best frame buffer size; current code uses a hard coded value.
    - TODO: currently gets a lot of brownouts when starting up; probably asking for image too early.
  - update web app to continuosly call the /capture endpoint in order to simulate streaming (see downsides in notes above).
- **v0.4**
  - implemented WebSocketsServer to push the image data down to the client.
  - updated client to listen for image data on websocket port 81, then turn it into a blob and assign to img element.  That replaces the prior 'fake' streaming where the client just called the /capture endpoint continuously.  This dramatically increases the framerate and reduces the latency.  It also reduces the connection time for the rover commands, so they are must more immediate and lively.  Probably a lot of that is that this is a totally separate server on a separate port for the images. 
  - web client now opens websocket to start streaming and closes it to stop streaming.  So server starts stream on first pong following connect and stops streaming on disconnect.
  - Fixed crash above 640x480 resolution.  Changed the image capture to take a processing function so that function can operate on the camera's frame buffer is a zero-copy way.  We can now change to any resolution to capture or stream.  We can even change the resolution while streaming.  NOTE: GrabImage still has the bug, but it is not called in this code.
  - At this point I was able to drive it remotely around my house from a browser in my office.  The control structure and latency make it difficult, but it is possible.
  - Added buttons to the web UI to control the rover's direction.
- **v0.5**
  - large changes.  
  - Code reorganization; the index html file was getting very large and unwieldly so it was reorganized.
    - reorganized code to javascript components are in js directory in separte javascript files; same with css.
    - created a version of the index html the references these unbundled assets; this is easier to work with when making changes (and serving from local server rather than the actual esp-32)
    - created a bundling tool that concatenates all the separate javascript files into one file named bundle.js; same with css.
    - modified the index html to include these bundled files
    - modified the main.cpp web server to serve the bundled files.
    - modified the asset to header file tool to handle any kind of file, so we can use it to turn the bundled js and css into header files so they can be served from main.cpp.
  - Added code to support gamepad input
  - Added code and UI to allow the user to choose between turtle, tank and joystick command interfaces.  The actual command code for tank and joystick commands is not yet written.
  - Refactored rover_l9110s.cpp so the command structure can more easily support tank and joystick input by controlling each wheel independantly.
  - TODO: create a websockets protocol for sending text commands for tank and joystick control.




### TODO
These are somewhat ordered, but priorities can change.  The overall goals are: 

1. FPV Rover with keyboard and web UI control. 
   - switch to ESPAsyncWebServer, implement minimal control via /rover endpoint (no UI yet).
   - Add UI to html to control the rover, so it can be controlled from devices that don't have a keyboard (like a phone).
   - Implement streaming video to browser using ~~ESPAsyncWebServer streaming response~~ websockets.
2. UI for recording and playing back a path (limited autonomy).
3. Enhanced FPV Rover with better speed and turn control and game controller input for a more natural user experience.
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
- [+] Implement wheel encoders for measuring speed and distance travelled.  
- [ ] Implement web UI for calibration of wheel encoders, RPM, distance (required wheel encodes)
- [ ] Implement PID algorithm to precisely control speed of motors (and so allow for any turning radius) using wheel encoders (requires calibration of wheel encoders).
- [ ] Implement command/time/distance recorder and associated UI so we can record and playback a path that has been driven (requires PID control).
- [ ] Implement Logo language subset (forward, backward, left, right, arc) interpreter on rover to allow scripts to be send to rover (requires PID control)
- [ ] Implement Logo editor and downloader, so Logo scripts can be edited in browser, then downloaded to rover for execution (requires Logo interpreter).
- [ ] Implement Logo simulator in browser, so user can preview their script (requires Logo interpreter).
- [ ] Implement CV lane following autopilot running on ESP32 (for Donkeycar kind of track).
- [ ] Implement object detection in browser using TensorFlow.js.  In particular, stop signs, traffic lights, pedestrians and other rovers such that the rover can obey signs and avoid collisions.
- [ ] Implement Neural Network autopilot in browser using Tensorflow.js
- [ ] Implement map and path planning such that rover can use autonomous mode to travel from a specified location to another on the map.  Think simulating a 4 block neighborhood with a perimeter road, 4 3-way intersections and a central 4 way intersections and at least one section of a gradual curve (rather than 90 degrees) so we can test smooth turning.
- [ ] Combine path planning, autonomy, obstacle detection and collision avoidance to implment an autonomous package delivery vehicle in a simulated neighbor hood.  Add a second autonomous rover.


## Rover control

### 4 Button Turtle Control 
In 4 button Turtle control mode, the rover has 4 movement commands; forward, turn left, turn right, and reverse.  The speed command sets the speed of the motors.  So when a direction command is given, the speed is based on the most recent speed command.  Finally there is the stop command, which will stop the motors.  
- forward
- turn left
- turn right
- reverse
- stop
- speed

Turtle Control is simple to understand and makes it easy to plan a route; it can also be implemented simply with UI buttons or a keyboard.  The left-turn and right-turn commands are really 'spin' commands; the rotation is around the center of the robot, between the two wheels.  If effect, it is like a 'turtle graphics' kind of control.  So Turtle control mode allows the bot to go forward or backward in a straight line and to spin left or right.  Smooth turns are not really possible, but must be broken up into short strait lines connected with small turns (like approximating a circle with a polygon).

The browser application provides 4 buttons in the UI to send these commands to the rover.  When a direction command is sent by clicking a direction button in the browser application, the command is sent and the button turns to a 'stop' button and the other 3 direction buttons become disabled until the 'stop' button is pressed.  This makes it visual obvious that the user should send a 'stop' command between movement commands.

In addition, the browser application binds the arrow keys on the keyboard of a desktop or laptop or Chromebook to send these commands to the rover.  The arrows keys are mapped as you might expect; up-arrow = forward, left-arrow = turn left, right-arrow = turn right, and down-arrow = reverse.  The application code always inserts a stop command between movement commands to make sure there is no attempt to change direction dramatically (like directly from full forward to full reverse) that has the possibility of damaging the motor's gears.

This is the default mode and works with any desktop or mobile browser.


### Tank Control
In tank control mode, each motor is controlled separately and can go either forward or backward with a specified speed.
- left forward/reverse
- right forward/reverse

This mode is meant to be used with a gamepad that has at least two analog joystick controls, like an XBox One controller or a Playstation 2, 3, or 4 controller.  Typically the left joystick's vertical axis would be used to drive the left wheel; push forward to turn the wheel forward, pull back to turn the wheel backward.  The speed of rotation is determined by how far the stick is moved.  Similarly, the right joystick is generally used to control the right wheel.

Because of the analog nature of the controls, much smoother movements can be created using this mode.

Tank control is enabled when a gamepad with at least two joysticks is connected to the computer that is running the browser application and a button or joystick on the gamepad is pressed or moved.


### Joystick control
In joystick control mode is meant to be used with a gamepad that has at least one analog joystick (the existence of 2 'axes' is assumed to mean one joystick).  One axes controls the forward/reverse speed (push forward to go forward, pull back to reverse) and the other axes controls turning (push left to turn left, push right to turn right).  The speed is determined by how far the joystick is pushed forward or backward and the angle or the turn is determined by how far the joystick is moved left or right.
- forward/reverse
- left/right

Joystick mode is perhaps the most natural driving mode.  

Note that it is also possible, on a gamepad with two analog joystics, to map the vertical axis of one joystick for forward/reverse and the horizontal axis of the other joystick for left/right turns.

Joystick control is enabled when gamepad with at least one analog joystick is connected to the computer that is running the browser application and a button or joystick on the gamepad is pressed or moved.


### Browser Gamepad support
Tank Control and Joystick Control require a gamepad connected to the machine running the browser application. Detection of the gamepad controller and configuration of the axes is done using the HTML5 gamepad API.  To make this mode available, you must first connect a gamepad controller that has at least one analog joystick for Joystick Control or two analog joysticks for Tank Control (actually, the existence of 2 'axes' is assumed to be a joystick, so 4 axes is assumed to be two joysticks).  Note that after the gamepad is connected to the computer, you must press a button or move a joystick before it is detected by the browser.

This has been tested on the latest Chrome and Firefox 77.01
- Firebox 77.01 on MacOS Catalina 10.15.5
- Chrome 83.0.4103.116 on MacOS Catalina 10.15.5

It appears the Apple Safari does not support the HTML5 Gamepad API.


## Bill of Materials
The parts are readily available from many suppliers.  I will provide links to Amazon (fast delivery) and AliExpress (low prices), but there are other suppliers that you may prefer.  Think of these links as a description of what you can get and about how much it will cost, rather than a suggestion for any particular supplier.  You may also choose to buy two at a time as this will also save money if you want spare parts or a second robot.  Also, it is sometimes easier to test code on parts rather than a fully assembled robot, so a second set of parts can be handy that way.

#### ESP32 Cam
This is a ESP32-S with an OV2640 camera.
- [Amazon](https://www.amazon.com/SongHe-ESP32-CAM-Development-Bluetooth-Arduino/dp/B07RB2J4XL/ref=sr_1_7)
- [AliExpress]()

#### USB to TTL converter
This is used send the program to the ESP32 Cam and read the output of the serial port.  There are a lot of different variations of this kind of board.
- [Amazon](https://www.amazon.com/HiLetgo-CP2102-Converter-Adapter-Downloader/dp/B00LODGRV8/ref=sr_1_4)
- [AliExpress]()

#### L9110S DC Motor Driver
This is used to control the two motors of the robot chassis.  It is connected to the ESP32 Cam pins to get 'commands' and to the two DC Motors to provide them with power and control signals.  This is a great chip for controlling small DC motors (and stepper motors) and they are cheaper when you buy several, so if you are interested in building with small DC motors, this is a great, inexpensive motor driver.
- [Amazon](https://www.amazon.com/Comimark-H-Bridge-Stepper-Controller-Arduino/dp/B07WZFGS81/ref=sr_1_14)
- [AliExpress]()

#### Smart Robot Car Chassis Kit
These kits can be had from many vendors.  They contain a clear plastic platform with mounting holes, two DC geared motors, two wheels and tires, one omnidirectional caster wheel, two optical encoder disks (for measuring speed; usable if you also get the IR Optocouplers below), a toggle switch, a battery box (which we are not going to use), a little wire and all the necessary mounting hardware.
- [Amazon](https://www.amazon.com/MTMTOOL-Smart-Chassis-Encoder-Battery/dp/B081GYVB6C/ref=sr_1_4)
- [AliExpress]()

These kids generally come with lead wires for connecting the dc motors, but they are not generally pre-soldered to the motors.  That means a little soldering.  That would be a good beginner's soldering task.  But if you don't want to solder at all then there is an alternative; you can purchase the motors with the wire leads already soldered.  They are more expensive, but they do avoid soldering. (see AdaFruit)

#### IR Slotted Optocouplers
These, in combination with the optical encoder discs that come with the Smart Robot Car Chassis Kit, can be used to measure wheel rotation, so you can precisely measure speed and distance travelled.  Note that you can find several differnt kinds of these slotted optocouplers.  The ones with the header pins on the opposite side of the board from the IR detector slots work best because the pins point 'up' while the slots points 'down'.  On some other kinds, the pins also point down and prevent the module from seating propertly.
- [Amazon](https://www.amazon.com/gp/product/B081W4KMHC/ref=ppx_yo_dt_b_asin_title_o06_s00)
- [AliExpress]()

## Preparing the web application
The file assets/index_ov2640.html is the html/css/javascript app that is loaded when the user hits the root url ('/').  To serve this file, we compress it using gzip and convert the resulting file to an array of bytes is a c-language header file src/ov2640.h.  There is a bash script that can be use to do this process with a single command; tools/binary_to_c_header.sh.  It takes two arguments; the first is the file to compress, the second is the name of the output header file.  So to create our file run this from the root of the project;
```
   tools/binary_to_c_header.sh assets/index_ov2640.html src/ov2640.h
```


Robot Application Architecture

Motor(forwardPin, reversePin)
- getPwmBits()
- setPower(bool forward, PwmValue pwm)
- setStall(PwmValue stallPwm) // set PWM at which the motor stalls (does not move)
  - when setPower() is called with a value at or below the stall value, zero will be used for PWM.
  - defaults to zero
Encoder(encoderPin, pulsesPerRevolution)
- getPulses() -> int
- setDirection(direction) // forward, reverse, stopped
- poll()    // update internal state

Wheel(diameter, motor, encoder, ppr)
- get position
  - WITH ENCODER: pi * diameter * encoder.count / encoder.ppr
  - WITH NO ENCODER: use target velocity * time.
- get velocity() -> WheelVelocity 
  - prior position and time
  - current position and time
  - return delta position / delta time 
- set velocity
  - SETS at target velocity for the wheel
  - WITH ENCODER: use a PID controller to maintain speed
  - WITH NO ENCODER: use calibration curve to calculate a pwm for desired speed.
- poll() // update internal state
  - WITH ENCODER: update PID loop and set new PWM to maintain target velocity.


TwoWheelPose {
    x,
    y,
    angle
}

TwoWheelVelocity {
    x,
    y,
    angle
}

TwoWheelDrivetrain(leftWheel, rightWheel, axleLength)
- getLocalPose() -> TwoWheelPose
- getLocalVelocity() -> TwoWheelVelocity
- poll() // update internal state