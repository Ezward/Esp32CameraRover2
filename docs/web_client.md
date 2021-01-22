## The Web Client
The rover code not only controls the motors and the camera, it is actually a web server that serves the client web application as html, css and JavaScript.  

![Rover web application](./images/rover_1.png)

Most web servers would serve such assets (html, css, javascript) by reading the files from a file system on disk, then sending them via http to the client.  However, we do this a little differently.

The ESP32 Cam does have a 'disk' in that we could use an sd card to hold the files, and we could write the server to read these files, then server them as they are requested.  We actually are not doing it that way because this would add an extra step in getting code to the rover; first we would need to upload the rover code to the ESP32 Cam via the serial connection, then we would need to pull out the SD card, insert it into the computer with which we are editing the code, write the client/ folder to the SD disk, pull out the SD card and reinsert it into the ESP32 Cam.  If both of these steps are not followed, we run the risk of having a set of rover code that is not compatible with the files on the SD card.  

Instead of reading the html, css and JavaScript from the SD card, we turn them into code that is then compiled into a large data array that duplicates what we would have read from disk, but in computer memory.  We then serve that to the client over http.  This requires a bundling and asset conversion step (see below). This done with tool scripts in the `/tools` folder; these steps could easily be added to a build system (like a Makefile).  Another big advantage in our context is that this makes serving those files much faster, since we don't have to read them first from an SD card.

### Asset bundling
The client web application uses a few separate css files and many javascript files.  We want to serve each of these in it's own single request from the client, rather than serving dozens of individual requests for the individual files.  To do that we simply concatenate all the css files into a single css file and all the javascript files into a single JavaScript file.  The bundled css and bundled javascript can then be served in just two requests.  We do this bundling with a bash script.

```
    tools/bundle_assets.sh
```

If you look at the `tools/bundle_assets.sh` bash script you will see that it explicitly copies all .js files to `bundle.js` and all .css files to `bundle.css`.  Note that if you add or remove a .css or .js file from the project, you will need to modifiy the bundling script accordingly.


### Serving assets
The file `client/index.html` is the html app that is loaded when the user hits the root url ('/').  To serve this file, we compress it using gzip and convert the resulting file to an array of bytes in a c-language header file `src/index_html.h`.  There is a bash script that is used to do this process with a single command; `tools/asset_to_c_header.sh`.  It takes two arguments; the first is the name for the asset file to compress, the second is the name of the output header file.  We do the same thing with the bundled javascript and bundled css.  So to create the header files used to serve the web application, run these commands from the root of the project;

```
tools/asset_to_c_header.sh index.html index_html.h
tools/asset_to_c_header.sh bundle.js bundle_js.h
tools/asset_to_c_header.sh bundle.css bundle_css.h
```

Both the bundling and conversion to c-header can be done in one step by calling the tools/bundle.sh script from the root of the project folder.

```
tools/bundle.sh
```

The next time you upload the rover application to the ESP32, the header files will be compiled into the rover application and uploaded with the rest of the rover code.  The are then served from memory (see src/main.c, )

### Debugging the Web Application
TODO: describe local web server and index_unbundled.html
We can serve the web application using a web server on the machine running your IDE.  It does not actually communicate to the rover, but it does allow you to make changes to the web application and quickly check them.

```
$ cd client
$ python -m SimpleHTTPServer
Serving HTTP on 0.0.0.0 port 8000 ...
```
- Goto the url `http://127.0.0.1:8000/index_unbundled.html` to see the local version of the client app.

### Web Application UI
- Camera Control
- Rover Telemetry
  - Motor Telemetry
  - Pose Telemetry
- Rover Control
  - Turtle Control
  - Tank Control
  - Joystick Control
  - Go To Goal
- Rover Calibration
  - Motor Stall
  - Motor Speed

### Web Application Internals and Extension Points
TODO