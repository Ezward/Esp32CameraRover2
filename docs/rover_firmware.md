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

NOTE: On startup the rover tries to connect to a wifi router using the credentials in the file `wifi_credentials.h`.  That file is NOT checked into the project source.  You will need to create one for yourself that provides credentials to your wifi router.  It is recommended that you do NOT check this into source control.  See the next section, Compiling the Firmware, for the format of `wifi_credentials.h`.

### Compiling the Firmware
See [Firmware Toolchain](./software_setup.md#firmware-toolchain)

This is detailed in in [Firmware Toolchain](./software_setup.md#firmware-toolchain) but it is worth mentioning again here.  The rover needs to compile in the wifi credentials for the wifi it will be operating in.  This is done by putting them in header file that gets included in the compile.
- Create a `wifi_credentials.h` in the `src/` folder - You must add your wifi credentials to this file.  Do NOT check this file into source control.  It should look like this;
```
const char* ssid = "yourwifi";
const char* password = "yourpassword";
```
- Now you can compile the firmware by selecting the check-mark on the toolbar at the bottom of the Visual Studio Window.

### Downloading the Firmware to the Rover
The ESP32Cam has very few available GPIO pins, so the output of the wheel encoder LM393 Optocoupler modules use the Serial TX/RX pins.  That means, in this hardware configuration, we cannot use serial output and wheel encoders at the same time.  So when downloading the firmware to the ESP32, we must disconnect the wheel encoder outputs and connect a USBtoSerial converter.  Once the download is complete, you can disconnect the USBtoSerial converter and reconnect the wheel encoder outputs.  In my prototype, I used a mini-breadboard as a switch-board for this purpose so I did not have to continually disconnect/reconnect dupont wires to the ESP32Cam.  Instead, I use a pair of wires to connect the TX/RX to a mini-breadboard and a pair to the USBtoSerial board and a pair to the wheel encoder outputs.  I connect the the USBtoSerial pair when downloading the firmware.  I connect the wheel encoder pair when I want to run the rover.

- Here is a good video from the Dronebot Workshop which includes a section on how to [download firmware to the ESP32Cam](https://youtu.be/visj0KE5VtY?t=429) 
- To use the serial TX/RX pins for downloading firmware, you must detach the encoder output wires from those pins and connect a USBtoSerial converter (make sure to use a 3.3v serial converter).  The Esp32Cam TX pin (gpio-01) must be connected to the RX pin on the USBtoSerial converter.  The Esp32Cam RX pin (gpio-03) must be connected to the TX pin on the converter.  Connect the GND pin on the converter to a common ground with the Esp32Cam.  Do NOT connect the output voltage from the converter; the converter is powered by the USB connection
- To put the Esp32Cam into programming mode you must also tie gpio-0 to ground.
- Once you have connected the USBtoSerial converter to the TX/RX pins (and to power and common ground), and connected gpio-0 to ground, then you must restart the Esp32Cam so it enters programming mode.
- Once in programming mode you can select the right arrow (->) button on the toolbar at the bottom of the Visual Studio Code window to download the firmware.
- If PlatformIO cannot find the serial port, check your connections.  In particular, make sure you have common ground between the Esp32Cam and the USBtoSerial converter; floating ground will disrupt the serial connection.  Also make sure you have TX->RX and RX->TX connections between the Esp32Cam and the converter.

#### Enabling Serial Output
The ESP32Cam has very few available GPIO pins, so the output of the wheel encoder LM393 Optocoupler modules use the Serial TX/RX pins.  That means, in this hardware configuration, we cannot use serial output and wheel encoders at the same time.  By default the firmware builds with wheel encoders support.  However, if you want serial, you can change the compile options in the platformio.ini file.  This is what it looks like by default: 
```
src_build_flags = 
	-D SERIAL_DISABLE=1
	-D USE_WHEEL_ENCODERS=1
	-D USE_ENCODER_INTERRUPTS=1
    -include arduino.h
```
So you can remove `-D USE_WHEEL_ENCODERS=1` and `-D SERIAL_DISABLE=1`, then the serial output will work, but encoders will not (and so speed control, pose estimation and go to goal behavior will not work correctly).

Note also that if you want to surface information from the rover, you might think about sending this back to the web client via the websocket interface rather than the serial port.

#### Finding the Rover's IP address
You will probably want disable encoders and [enable serial output](#enabling-serial-output) when you first compile and download the firmware, so you can find the IP address of the rover.  When serial output is enabled, the rover will print it's IP address to the serial output on startup.  Alternatively, you can use your WIFI router's administration UI to find the IP address that it assigned to the rover; see your router's documentation.  Once you do that, you can use the WIFI router's administration UI to pin the rover to that IP address, so you will always know the rover's IP when it connects to that router.  That is often called Address Reservation in the router's software; see your router's documentation.

### Firmware Internals
TODO

Here is a slideshow discussing and illustrating the [EzRover algorithms](https://docs.google.com/presentation/d/1t77gDPORG4qcxwhPNWrPlTVjwQWncRw7ujsnF02ZN7E/edit?usp=sharing).
