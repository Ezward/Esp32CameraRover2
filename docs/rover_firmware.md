## The Rover Application
The rover code (this is what I'll call the code that runs on board the ESP32) runs in the ESP32 Cam microcontroller.  It is written in Arduino flavor C++.  It includes 3 big pieces of functionality;
- The web server code
- The camera code
- The rover code

***The ESP32 Application Structure***
- WebServer - handle camera configuration requests
- Streaming Server - receive rover commands, stream image frames
- Camera - configure and read frames from the ESP32 Camera
- TwoWheelRover
    - CommandProcessor - parse rover commands and execute them on the rover.
    - DriveWheel x2
        - Motor - send control signals to the motor via a L9110s motor controller board
        - Encoder - read wheel revolutions using optical-interrupter board
        - SpeedController - control wheel speed using a software PID controller
    - Pose Estimator - continually update the rover's idea of it's position and orientation as it moves.
    - GotoGoal Behavior - Use speed control and pose estimation drive the rover to a given (x,y) position

Much of the camera code in `src/camera` is adapted from the ESP32 Cam `CameraWebServer` demonstration sketch provided with the ESP32 Cam Arduino framework.  It would be worth your time to get that demo application running on your ESP32 Cam before you attempt to build the rover and run the rover application.  That will give you the opportunity to learn how to install the necessary libraries and how to upload programs to the ESP32 Cam via a USB-to-Serial adapter board.  I recommend the [article](https://dronebotworkshop.com/esp32-cam-intro/) and [video](https://www.youtube.com/watch?v=visj0KE5VtY) from The Dronebot Workshop.  He provides an excellent, thorough description of how to setup the software and upload and run the demonstration script.  NOTE: after showing how to run the demonstration sketch, he goes into a section of how to add an external antenae to the ESP32 Cam; you do NOT need to do that for this project.

NOTE: On startup the rover tries to connect to a wifi router using the credentials in the file `wifi_credentials.h`.  That file is NOT checked into the project source.  You will need to create one for yourself that provides credentials to your wifi router.  It is recommended that you do NOT check this into source control.

### Compiling the Firmware
TODO

- wifi_credentials.h - You must add your wifi credentials to this file.  Do NOT check this file into source control.

### Downloading the Firmware to the Rover
TODO
TODO: sharing serial connection and wheel encoder pins

#### Finding the Rover's IP address
- Since the wheel encoders use the serial pins, we must disable wheel encoders in order to allow the rover to print it's IP address to the serial output so we can capture it.  Once you boot the rover with encoders disabled and serial output connected, you will see the rover print it's IP address on startup.  You should right that IP address down.  Further, you will want to configure your router so it always assigns that IP address to your rover, this is often called Address Reservation.  That process is specific to your router

### Firmware Internals
TODO