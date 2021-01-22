## Tags
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
- **v0.6**
    My original hope was to add a PID controller, but I found that
    using a contant increment controller worked well, but was 
    a little slow.  I added a feed-forward mechanism to estimate
    ths initial PWM so that the constant controller would converge
    much faster.  These in combination make it so the rover can
    drive a fairly straight line without consulting distance 
    travelled by each wheel; we can do better if we add lateral
    control using distance travelled.
    The addition of realtime telemetry from the rover back to 
    the web client has been invaluable in figuring out how to 
    make this work.  As a bonus, I've written a system to 
    listen for telemetry, parse it into usable data, then 
    publish it on a MessageBus.  TelemetryListeners then
    subscribe to this data and buffer it.  
    I've also added a charting system that can take the data
    from the TelemetryListeners and plot it in real time
    to a canvas element, so we can now see the speed control
    working graphically in realtime.
  - I suck at tagging.  Ton's of features and code changes have accumulated since v0.5
  - Implemented a websockets protocol for sending text commands for tank and joystick control.
  - Implemented interrupt driven reading of LM393 optical encoders to measure wheel speed.
    - this turned out be be quite a pain because of the limited number of gpio pins on the ESP32Cam.  I basically had to disable serial output so we could then use the pins that would be used for the serial console.  So, we either get speed control or we get serial output.  As you will see below, this is not terrible because I added telemetry from rover to web client via websockets.
  - Implemented a feed-forward step controller to control speed and help rover travel in a straight line at a desired speed.
    - this require a bunch of UI so motor parameters could be configured
      - PWM stall values for each motor, so we know minimum PWM value necessary to get motor turning and we can avoid 'dead zones' where PWM values resulting in voltages too low to turn the motors.
      - minimum speed the motor can maintain
      - maximum speed the motor can maintain
    - there is UI to input PID gain values, but these are not currently used (because we are using a step controller)
  - Implemented telemetry from the rover to the web client over command websocket.  Now we can see the chose pwm, the target speed (if speed control is engaged) and the actual speed.
  - Implemented a system to read motor telemetry in CommandSocket, parse it and publish it.
    - TelemetryListener can listen for telemetry from a specific wheel and buffer data and accumlate useful statistics (min and max).
    - TelemetryListener also publishes a message when data is added; that is critical for plotting telemetry in realtime
  - Implemented a realtime drawing of telemetry to a canvas.
    - LineChart and Axis chart primitives
    - CanvasViewController for binding to a canvas and painting it when telemetry is added.
    - TelemetryCanvasPainter used data in associated TelemetryListeners to draw pwm, target speed and actual speed in realtime.
  - Implemented singleton config object to hold global readonly configuration.
  - Updated range input controls so they have increment and decrement buttons at either end of the slider.  This makes the control much easier to use on a mobile phone.
- **v0.7**
  - This version adds pose estimation and visualization.  In addition, I've improved speed control so it operates more smoothly.
  - Added a Go-To-Goal behavior that can be initiated from the 'Rover Control' tab panel.
  - Added ability to reset the telemetry without needing to reboot the rover.
