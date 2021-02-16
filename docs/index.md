# EzRover : Cheap, Capable, Extensible Differential Drive Robots

EzRover is a framework for creating cheap, capable and extensible differential drive robots.  The repository includes a C++ application that runs on the rover and a JavaScript web application that is served by the rover and is used to command the rover and to receive and visualize video and telemetry.  Finally, the repository includes hardware specifications and assembly instructions for a inexpensive (less than $40), easy to build (little or no soldering) robot based on the Esp32Cam microcontroller.

The framework implements important robot primitives in the C++ application such as a websocket command protocol, closed loop speed control, pose estimation and go to goal behavior.  These primitives are implemented in C++ and run on the rover so they run fast and with low latency.

In addition, the rover serves it's own JavaScript web application which is used to calibrate and command the rover and to visualize video and telemetry from the rover.  The JavaScript web application is a distinguishing feature of this framework.  It can be used to extend the rover's capabilities using a friendly programming language (JavaScript) and powerful technologies like OpenCV.js and Tensorflow.js.

![EzRover side view](./images/ezrover_side_view.jpg)

- The Software
    - [Rover Firmware](./rover_firmware.md)
      - Here are slides describing the [EzRover underlying algorithms](https://docs.google.com/presentation/d/1t77gDPORG4qcxwhPNWrPlTVjwQWncRw7ujsnF02ZN7E/edit?usp=sharing).
    - [Web Application](./web_client.md)
        - Here is an [EzRover introduction](https://youtu.be/yN2ya2mlBNU) video.
        - [Rover Control](./rover_control.md)
          - Here is a video describing the  [EzRover calibration](https://youtu.be/ciDCUUx8MXI) process.
          - Here is a video showing the [EzRover Go to Goal](https://youtu.be/_eKCqswX5D0) behavior.
- [The Hardware](./building_the_rover.md)
- [Todo](./todo.md)
- [Tags](./tags.md)

![Web Application Video and Pose Telemetry](./images/video_and_pose.png)

## Videos
Here a some videos that show the EzRover and web application is action:
- [EzRover 01 Introduction](https://youtu.be/yN2ya2mlBNU)
- [EzRover 02 Calibration](https://youtu.be/ciDCUUx8MXI)
- [EzRover 03 Go to Goal](https://youtu.be/_eKCqswX5D0)
- [EzRover 04 Go to Goal](https://youtu.be/TjE9ceNOTJE)
