# Esp32CameraRover2

This sketch uses an ESP32 Cam, an L9110S dc motor controller and a commonly available Robot Car chassis to create a First-Person-View (FPV) robot that can be driven from any web browser.


## Status
- The [first iteration](https://github.com/Ezward/Esp32CameraRover) used the canonical Esp32CameraWebServer example sketch as its basis and added the rover functionality to it.  However, the results were disappointing.  This iteration replaces the default polled webserver with ESPAsyncWebService, which is a more capable webserver that can handle multiple requests simulateously.  Also the api is much, much nicer than the default esp webserver.  We also move from the Arduino IDE to the PlatformIO IDE, which adds lots of IDE goodness, especially preview of class api's and function arguments, which makes both understanding and writing code much more efficient.  You need to install more stuff; you still need the lastest Arduino IDE, because in comes with the Ardunio SDK.  You also need to install Microsoft Visual Studio, since PlatformIO is a plugin for MSV.  Follow the PlatformIO instructions for installation into Microsoft Visual Studio.  You can then close this repo and open it in PlatformIO.
- At this point the basic rover commands are implemented in the web server and the client html is served, so the car can be controlled from the browser machine's keyboard.  This is the same as the first iteration.  We still seem to get pretty slow response to commands; the rover commands seem to take at least a second before they return and they often fail to return a status code, which causes problems for the client.  I think the thing to do there is to place commands in a queue and have a separate task (ESP32 FreeRTOS task) to pull them from the queue and execute them.  That way web server is not in the middle of handling a request when we are writing to the hardware gpio.  This may be enough, but we should also think about whether we want to move to websockets for commands, because we build the connection once and leave it open, it may reduce the overhead associated with open and closing connections for each request.
  - The code has been refactored to change the /rover handler to add the command to a queue rather than execute it directly, before the response is sent.  Now the code adds the command to a command queue, then returns from the handler.  A FreeRTOS task is used to process the commands in the command queue, outside of the request handler and independantly from other code.  The queue is small, since we expect they will come in slowly and we expect to be able to execute them quickly.  The queue is a circular queue with a byte for head and tail indices.  The code is organized, assuming a single producer and a single consumer, to work without any semaphores.
  - The issue with slow commands seems to be due to brownouts in the ESP32.  The same 5v supply was being used for the ESP32 and the two DC Motors (via the L9110s). The battery supplies 3A, but the peak power draw of the motors still was a problem.  That is solved by providing a separate power supply for the CPU and another for the L9110s and motors.  With the queue change and the power change, the code now responds to commands better; it feels like 200ms or 300ms latency.  I think that we might be able to improve this if we use a websocket connection between the client and the ESP32.  That would also provide guaranteed ordering of commands, which current design does not, although it is unlikely to be a real proble with human input it may be a problem with an autopilot.  Also, a websocket connection would allow the ESP3 to push information back to the client; this would also be used to provide telemetry to the user (possibly including the video).
- Added code to capture a single frame on the /image endpoint.  Also added all the code to handle the control panel so image properties can be configured (/control and /status endpoints).  The plan for 'video' is to simply continuously update the image; in the html/javascript we will add an onload handler which will update the image url again with a new cache buster, forcing a new image to be requested from the server continuously.  So we won't both with a 'stream' based on a multipart return; that was basically doing something similar; when the web client acked the last image it would return a new one.  So I expect this method to be about as good and much simpler to implement.
- This this iteration is using simple LOW/HIGH output to control the motors, so speed is zero or 100%.  We will attempt to use PWM again later.
- This this iteration does not yet incorporate the optocouplers so actual speed is unknown.

### Tags
- **v0.2**
  - Serve gzipped html/css/javascript page.
  - Control rover with keyboard.
  - /rover handler adds command to a queue and returns immediately to caller.
  - FreeRTOS background task is used to process the command queue.
- **v0.3**
  - /image to get a single image based on the current camera configuration
  - /control to set the camera configuration
  - /status to get the camera configuration
  - /health to get the health of the server
  - /stream returns a 501 Not Implemented
  - ported the camera properties code from the canonical Esp32CameraWebServer sample and adapted it to the ESPAsyncWebServer.
    - TODO: need to port the code that calculates the best frame buffer size; current code uses a hard coded value.
    - TODO: currently gets a lot of brownouts when starting up; probably asking for image too early.

### TODO
These are somewhat ordered, but priorities can change.  The overall goals are: 

1. FPV Rover with keyboard or web UI control. 
   - switch to ESPAsyncWebServer, implement minimal control via /rover endpoint (no UI yet).
   - Add UI to html to control the rover, so it can be controlled from devices that don't have a keyboard (like a phone).
   - Implement streaming video to browser using ESPAsyncWebServer streaming response.
2. UI for recording and playing back a path (limited autonomy).
3. Enhanced FPV Rover with better speed and turn control and game controller input for a more natural user experience.
4. Autonomous lane following.
5. Object recognition and collision avoidance.

- [ ] Change to a more performant web server that will allow simultanous streaming of images and processing of rover commands.
- [ ] Implement websocket protocol and serve images over websocket (may just be part of improving performance, but down the road we want to also use it so send commands to rover).
- [ ] Implement websocket protocol to send commands from browser to rover (rather than HTTP GET api; this forces ordering of commands).
- [ ] Implement authentication so only one person can be driving, but any number of people can be viewing.
- [ ] Implement optocouplers for measuring speed and distance travelled.  Add precision commands, 180 degree turn (turn around), turn 90 degrees right, turn 90 degrees left. 
- [ ] Implement command/time/distance recorder and associated UI so we can record and playback a path that has been driven.
- [ ] Implement PWM control for motor speed (and modify UI to support this).
- [ ] Implement PID algorithm to precisely control speed of motors (and so allow for any turning radius).
- [ ] Implement game controller input (via browser's game control api).
- [ ] Implement CV lane following autopilot running on ESP32 (for Donkeycar kind of track).
- [ ] Implement object detection in browser using TensorFlow.js.  In particular, stop signs, traffic lights, pedestrians and other rovers such that the rover can obey signs and avoid collisions.
- [ ] Implement Neural Network autopilot in browser using Tensorflow.js
- [ ] Implement map and path planning such that rover can use autonomous mode to travel from a specified location to another on the map.  Think simulating a 4 block neighborhood with a perimeter road, 4 3-way intersections and a central 4 way intersections and at least one section of a gradual curve (rather than 90 degrees) so we can test smooth turning.
- [ ] Combine path planning, autonomy, obstacle detection and collision avoidance to implment an autonomous package delivery vehicle in a simulated neighbor hood.  Add a second autonomous rover.

## Parts
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

#### IR Slotted Optocouplers
These, in combination with the optical encoder discs that come with the Smart Robot Car Chassis Kit, can be used to measure wheel rotation, so you can precisely measure speed and distance travelled.  Note that you can find several differnt kinds of these slotted optocouplers.  The ones with the header pins on the opposite side of the board from the IR detector slots work best because the pins point 'up' while the slots points 'down'.  On some other kinds, the pins also point down and prevent the module from seating propertly.
- [Amazon](https://www.amazon.com/gp/product/B081W4KMHC/ref=ppx_yo_dt_b_asin_title_o06_s00)
- [AliExpress]()
