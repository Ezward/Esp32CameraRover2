#include <Arduino.h>
#ifdef ESP32
#include <AsyncTCP.h>
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#endif
#include <ESPAsyncWebServer.h>
#include <WebSocketsServer.h>

// gzipped html content
#include "camera/camera_index.h"
#include "camera/camera_wrap.h"

#include "string/strcopy.h"
#include "websockets/command_socket.h"
#include "websockets/stream_socket.h"
#include "serial.h"
#include "gpio/pwm.h"
#include "motor/motor_l9110s.h"
#include "encoder/encoder.h"
#include "encoders.h"

//
// control pins for the L9110S motor controller
//
#include "rover/rover.h"
const int A1_A_PIN = 15;    // left forward input pin
const int A1_B_PIN = 13;    // left reverse input pin
const int B1_B_PIN = 14;    // right forward input pin
const int B1_A_PIN = 2;     // right reverse input pin

const int LEFT_FORWARD_CHANNEL = 12;    // pwm write channel
const int LEFT_REVERSE_CHANNEL = 13;    // pwm write channel
const int RIGHT_FORWARD_CHANNEL = 14;   // pwm write channel
const int RIGHT_REVERSE_CHANNEL = 15;   // pwm write channel

//
// wheel encoders use same pins as the serial port,
// so if we are using encoders, we must disable serial output/input
//
// #define USE_WHEEL_ENCODERS
#ifdef USE_WHEEL_ENCODERS
    #ifdef SERIAL_DISABLE
        #undef SERIAL_DISABLE
    #endif
    #define SERIAL_DISABLE  // disable serial if we are using encodes; they use same pins
#endif

const int LEFT_ENCODER_PIN = 3;         // left LM393 wheel encoder input pin
const int RIGHT_ENCODER_PIN = 1;        // right LM393 wheel encoder input pin
const int PULSES_PER_REVOLUTION = 20;   // number of slots in encoder wheel

const int BUILTIN_LED_PIN = 33;    // not the 'flash' led, the small led
bool builtInLedOn = false;

//
// Include _after_ encoder stuff so SERIAL_DISABLE is correctly set
//
// leave LOG_LEVEL undefined to turn off all logging
// or define as one of ERROR_LEVEL, WARNING_LEVEL, INFO_LEVEL, DEBUG_LEVEL
//
#define LOG_LEVEL INFO_LEVEL
#include "log.h"

//
// put ssid and password in wifi_credentials.h
// and do NOT check that into source control.
//
#include "wifi_credentials.h"
//const char* ssid = "******";
//const char* password = "******";

//
// camera stuff
//

void statusHandler(AsyncWebServerRequest *request);
void configHandler(AsyncWebServerRequest *request);
void captureHandler(AsyncWebServerRequest *request);
void roverHandler(AsyncWebServerRequest *request);
void roverTask(void *params);
TaskHandle_t roverTaskHandle;

void videoHandler(AsyncWebServerRequest *request);

// health endpoint
void healthHandler(AsyncWebServerRequest *request);

//
// It's critical that PwmChannels exist for life of the motor instance
//
PwmChannel leftForwardPwm(A1_A_PIN, LEFT_FORWARD_CHANNEL, MotorL9110s::pwmBits());
PwmChannel leftReversePwm(A1_B_PIN, LEFT_REVERSE_CHANNEL, MotorL9110s::pwmBits());
MotorL9110s leftMotor;
#ifdef USE_WHEEL_ENCODERS
    Encoder leftWheelEncoder(LEFT_ENCODER_PIN);
    Encoder *leftWheelEncoderPtr = &leftWheelEncoder;
#else
    Encoder *leftWheelEncoder = NULL;
#endif

PwmChannel rightForwardPwm(B1_B_PIN, RIGHT_FORWARD_CHANNEL, MotorL9110s::pwmBits());
PwmChannel rightReversePwm(B1_A_PIN, RIGHT_REVERSE_CHANNEL, MotorL9110s::pwmBits());
MotorL9110s rightMotor;
#ifdef USE_WHEEL_ENCODERS
    Encoder rightWheelEncoder(RIGHT_ENCODER_PIN);
    Encoder *rightWheelEncoderPtr = &rightWheelEncoder;
#else
    Encoder *rightWheelEncoder = NULL;
#endif

TwoWheelRover rover;


// create the http server and websocket server
AsyncWebServer server(80);

// 404 handler
void notFound(AsyncWebServerRequest *request)
{
    request->send(404, "text/plain", "Not found");
}


void setup()
{
    // 
    // init serial monitor
    //
    SERIAL_BEGIN(115200);
    SERIAL_DEBUG(true);
    SERIAL_PRINTLN();

    LOG_INFO("Setting up...");

    //
    // initialize motor output pins
    //
    rover.attach(
        leftMotor.attach(leftForwardPwm, leftReversePwm), 
        rightMotor.attach(rightForwardPwm, rightReversePwm),
        leftWheelEncoderPtr,
        rightWheelEncoderPtr);
    #ifdef USE_WHEEL_ENCODERS
        #ifdef USE_ENCODER_INTERRUPTS
            attachEncoderInterrupts(leftWheelEncoder, rightWheelEncoder, PULSES_PER_REVOLUTION);
        #endif
        pinMode(BUILTIN_LED_PIN, OUTPUT);
    #endif
    LOG_INFO("...Rover Initialized...");

    // 
    // init wifi
    //
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    if (WiFi.waitForConnectResult() != WL_CONNECTED)
    {
        LOG_ERROR("WiFi Failed!\n");
        return;
    }

    SERIAL_PRINT("...Wifi initialized, running on IP Address: ");
    SERIAL_PRINTLN(WiFi.localIP().toString());
    SERIAL_PRINT("ESP Board MAC Address:  ");
    SERIAL_PRINTLN(WiFi.macAddress());

    //
    // init web server
    //

    // endpoints to return the compressed html/css/javascript for running the rover
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        LOG_INFO("handling " + request->url());
        AsyncWebServerResponse *response = request->beginResponse_P(200, "text/html", index_html_gz, sizeof(index_html_gz));
        response->addHeader("Content-Encoding", "gzip");
        request->send(response);
    });
    server.on("/bundle.css", HTTP_GET, [](AsyncWebServerRequest *request) {
        LOG_INFO("handling " + request->url());
        AsyncWebServerResponse *response = request->beginResponse_P(200, "text/css", bundle_css_gz, sizeof(bundle_css_gz));
        response->addHeader("Content-Encoding", "gzip");
        request->send(response);
    });
    server.on("/bundle.js", HTTP_GET, [](AsyncWebServerRequest *request) {
        LOG_INFO("handling " + request->url());
        AsyncWebServerResponse *response = request->beginResponse_P(200, "text/javascript", bundle_js_gz, sizeof(bundle_js_gz));
        response->addHeader("Content-Encoding", "gzip");
        request->send(response);
    });

    server.on("/health", HTTP_GET, healthHandler);

    // endpoint for sending rover commands
    server.on("/rover", HTTP_GET, roverHandler);

    // endpoint for streaming video from camera
    server.on("/control", HTTP_GET, configHandler);
    server.on("/status", HTTP_GET, statusHandler);
    server.on("/capture", HTTP_GET, captureHandler);
    server.on("/stream", HTTP_GET, notFound /*videoHandler*/);

    // return 404 for unhandled urls
    server.onNotFound(notFound);

    // start listening for requests
    server.begin();
    LOG_INFO("... http server intialized ...");

    //
    // init websockets
    //
    wsStreamInit();
    wsCommandInit();
    LOG_INFO("... websockets server intialized ...");

    //
    // create background task to execute queued rover tasks
    //
    // xTaskCreate(roverTask, "roverTask", 1024, NULL, 1, &roverTaskHandle);

    //
    // initialize the camera
    //
    initCamera();
}

void healthHandler(AsyncWebServerRequest *request)
{
    LOG_INFO("handling " + request->url());

    // TODO: determine if camera and rover are healty
    request->send(200, "application/json", "{\"health\": \"ok\"}");
}

//
// handle /capture
//
void captureHandler(AsyncWebServerRequest *request)
{
    LOG_INFO("handling " + request->url());

    //
    // 1. create buffer to hold image
    // 2. capture a camera image
    // 3. create response and send it
    // 4. free the image buffer
    //
 
 
    // 1. create buffer to hold frames
    uint8_t* jpgBuff = new uint8_t[68123];  // TODO: should be based on image dimensions
    size_t   jpgLength = 0;

    // 2. capture a camera image
    esp_err_t result = grabImage(jpgLength, jpgBuff);

    // 3. create and send response
    if(result == ESP_OK){
        request->send_P(200, "image/jpeg", jpgBuff, jpgLength);
    }
    else
    {
        request->send(500, "text/plain", "Error capturing image from camera");
    }

    //
    // 4. free the image buffer
    //
    delete jpgBuff;
}

//
// handle /stream
// start video stream background task
//
void videoHandler(AsyncWebServerRequest *request)
{
    LOG_INFO("handling " + request->url());
    request->send(501, "text/plain", "not implemented");
}



/******************************************************/
/*************** main loop ****************************/
/******************************************************/
void loop()
{
    rover.poll();
    
    // poll stream to send image to clients via websocket
    wsStreamCameraImage();
    wsStreamPoll();

    // poll stream that gets command via websocket
    wsCommandPoll();

    #ifdef USE_WHEEL_ENCODERS
        // logWheelEncoders(wsCommandLogger);

        //
        // blink built-in led on each revolution
        //
        const unsigned int leftWheelCount = rover.readLeftWheelEncoder();
        const boolean ledOn = (0 == (leftWheelCount / (PULSES_PER_REVOLUTION / 2)) % 2);
        if (ledOn != builtInLedOn) {
            digitalWrite(BUILTIN_LED_PIN, ledOn ? LOW : HIGH);  // built in led uses inverted logic; low to light
            builtInLedOn = ledOn;
        }
    #endif
}

/******************************************************/
/*************** rover control ************************/
/******************************************************/

//
// handle '/rover' endpoint.
// optional query params
// - speed: 0..255
// - direction: stop|forward|reverse|left|right
//
void roverHandler(AsyncWebServerRequest *request)
{
    LOG_INFO("handling " + request->url());

    String directionParam = "";
    if (request->hasParam("direction", false))
    {
        directionParam = request->getParam("direction", false)->value();
    }
    
    String speedParam = "";
    if (request->hasParam("speed", false))
    {
        speedParam = request->getParam("speed", false)->value();
    }

    //
    // submit the command to a queue and return
    //
    if((NULL == directionParam) 
        || (NULL == speedParam)
        || (SUCCESS != rover.submitTurtleCommand(directionParam.c_str(), speedParam.c_str())))
    {
        request->send(400, "text/plain", "bad_request");
    }

    request->send(200, "text/plain", directionParam + "," + speedParam);
}


//
// background task to process queue commands 
// as they appear.
//
void roverTask(void *params) {
    //
    // read next task from the command queue and execute it
    //
    TankCommand command;

    for(;;) 
    {
        if (SUCCESS == rover.dequeueRoverCommand(&command)) {
            LOG_INFO("Executing RoveR Command");
            rover.executeRoverCommand(command);
            taskYIELD();    // give web server some time
        }
    }
}


/*
 * Handle /status web service endpoint;
 * - response body is is json payload with
 *   all camera properties and values like;
 *   `{"framesize":0,"quality":10,"brightness":0,...,"special_effect":0}`
 */
void statusHandler(AsyncWebServerRequest *request) 
{
    LOG_INFO("handling " + request->url());

    const String json = getCameraPropertiesJson();
    request->send_P(200, "application/json", (uint8_t *)json.c_str(), json.length());
}


//
// handle /control
//
void configHandler(AsyncWebServerRequest *request) {
    LOG_INFO("handling " + request->url());

    //
    // validate parameters
    //
    String varParam = "";
    if (request->hasParam("var", false))
    {
        varParam = request->getParam("var", false)->value();
    }
    
    String valParam = "";
    if (request->hasParam("val", false))
    {
        valParam = request->getParam("val", false)->value();
    }

    // we must have values for each parameter
    if (varParam.isEmpty() || valParam.isEmpty()) 
    {
        request->send(400, "text/plain", "bad request; both the var and val params must be present.");
    }
    else
    {
        const int status = setCameraProperty(varParam, valParam);
        if(SUCCESS != status) {
            LOG_ERROR("Failure setting camera property");
        }
        request->send((SUCCESS == status) ? 200: 500);
    }
}


