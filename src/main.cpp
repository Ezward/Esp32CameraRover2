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

#include "config.h"

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
#include "wheel/drive_wheel.h"
#include "telemetry.h"

//
// control pins for the L9110S motor controller
//
#include "rover/rover.h"

//
// wheel encoders use same pins as the serial port,
// so if we are using encoders, we must disable serial output/input
//
#ifdef USE_WHEEL_ENCODERS
    #ifdef SERIAL_DISABLE
        #undef SERIAL_DISABLE
    #endif
    #define SERIAL_DISABLE  // disable serial if we are using encodes; they use same pins
#endif

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
// camera web service endpoints
//
void statusHandler(AsyncWebServerRequest *request);
void configHandler(AsyncWebServerRequest *request);
void captureHandler(AsyncWebServerRequest *request);

// health endpoint
void healthHandler(AsyncWebServerRequest *request);

// 404 not found handler
void notFound(AsyncWebServerRequest *request);

//
// Create all the parts for the rover.
// It's CRITICAL that PwmChannels exist for life of the motor instance
//

MessageBus messageBus;
TelemetrySender telemetry;

// left drive wheel
PwmChannel leftForwardPwm(A1_A_PIN, LEFT_FORWARD_CHANNEL, MotorL9110s::pwmBits());
PwmChannel leftReversePwm(A1_B_PIN, LEFT_REVERSE_CHANNEL, MotorL9110s::pwmBits());
MotorL9110s leftMotor;
#ifdef USE_WHEEL_ENCODERS
    Encoder leftWheelEncoder(LEFT_ENCODER_PIN, 0);
    Encoder *leftWheelEncoderPtr = &leftWheelEncoder;
#else
    Encoder *leftWheelEncoder = NULL;
#endif
DriveWheel leftWheel(LEFT_WHEEL_SPEC, WHEEL_CIRCUMFERENCE);

// right drive wheel
PwmChannel rightForwardPwm(B1_B_PIN, RIGHT_FORWARD_CHANNEL, MotorL9110s::pwmBits());
PwmChannel rightReversePwm(B1_A_PIN, RIGHT_REVERSE_CHANNEL, MotorL9110s::pwmBits());
MotorL9110s rightMotor;
#ifdef USE_WHEEL_ENCODERS
    Encoder rightWheelEncoder(RIGHT_ENCODER_PIN, 1);
    Encoder *rightWheelEncoderPtr = &rightWheelEncoder;
#else
    Encoder *rightWheelEncoder = NULL;
#endif
DriveWheel rightWheel(RIGHT_WHEEL_SPEC, WHEEL_CIRCUMFERENCE);

// rover
TwoWheelRover rover(WHEELBASE);

// create the http server
AsyncWebServer server(80);

/**
 * Arduino setup
 * - called once by Arduino framework before loop() 
 *   so that systems can be initialized.
 */
void setup()
{
    //
    // initialize serial monitor
    // NOTE: if SERIAL_DISABLE is defined, then SERIAL_xxxx calls are all no-ops
    //
    SERIAL_BEGIN(115200);
    SERIAL_DEBUG(true);
    SERIAL_PRINTLN();

    LOG_INFO("Setting up...");

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

    // endpoints to return the compressed html/css/javascript for the browser web application
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

    // endpoint to check server health
    server.on("/health", HTTP_GET, healthHandler);

    // endpoint for streaming video from camera
    server.on("/control", HTTP_GET, configHandler);     // set a single camera setting
    server.on("/status", HTTP_GET, statusHandler);      // return camera settings
    server.on("/capture", HTTP_GET, captureHandler);    // return a single image
    server.on("/stream", HTTP_GET, notFound /*videoHandler*/);  // we've decprecated and moved into websockets

    // return 404 for unhandled urls
    server.onNotFound(notFound);

    // start the server listening for requests
    server.begin();
    LOG_INFO("... http server intialized ...");

    //
    // initialize websockets for streaming video and rover commands
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

    //
    // initialize rover dependancies
    //
    // NOTE: This MUST happen AFTER other initializations.
    //       I suspect that the camera or wifi code uses the 
    //       serial pins when they first start, however we use the 
    //       serial port pins for the wheel encoders.  So we must 
    //       attach to those pins after those systems are started.
    //
    telemetry.attach(&messageBus);
    rover.attach(
        leftWheel.attach(
            leftMotor.attach(leftForwardPwm, leftReversePwm), 
            leftWheelEncoderPtr, 
            PULSES_PER_REVOLUTION, 
            &messageBus),
        rightWheel.attach(
            rightMotor.attach(rightForwardPwm, rightReversePwm), 
            rightWheelEncoderPtr, 
            PULSES_PER_REVOLUTION, 
            &messageBus),
        &messageBus);

    #ifdef USE_WHEEL_ENCODERS
        // internal led will blink on each wheel rotation
        pinMode(BUILTIN_LED_PIN, OUTPUT);
    #endif

    LOG_INFO("...Rover Initialized...");

}

/**
 * Arduino main loop
 * - called after setup() 
 * - called continuously by Arduino framework as fast as possible.
 */
void loop()
{
    // poll all rover systems (motor, encoders, speed controllers)
    rover.poll();
    
    // poll stream to send image to clients via websocket
    wsStreamCameraImage();
    wsStreamPoll();

    // poll stream that gets command via websocket
    wsCommandPoll();

    #ifdef USE_WHEEL_ENCODERS
        //
        // blink built-in led on each wheel revolution
        //
        const unsigned int leftWheelCount = rover.readLeftWheelEncoder();
        const boolean ledOn = (0 == (leftWheelCount / (PULSES_PER_REVOLUTION / 2)) % 2);
        if (ledOn != builtInLedOn) {
            digitalWrite(BUILTIN_LED_PIN, ledOn ? LOW : HIGH);  // built in led uses inverted logic; low to light
            builtInLedOn = ledOn;
        }
    #endif
}


/************ web server endpoint handlers ************/
// These are called by the webserver when a request 
// for the associated url is received.
// They should not be called directly.

/**
 * Handle request for unknown url with a 404 response code
 */
void notFound(AsyncWebServerRequest *request)
{
    request->send(404, "text/plain", "Not found");
}


/**
 * Health endpoint returns 200 with json body
 * indicating health of server
 */
void healthHandler(AsyncWebServerRequest *request)
{
    LOG_INFO("handling " + request->url());

    // TODO: determine if camera and rover are healty
    request->send(200, "application/json", "{\"health\": \"ok\"}");
}

/**
 * handle /capture endpoints
 * - return 200 response with a single jpeg camera image 
 * - on error, return 500 with text body indicating the error
 */
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


/**
 * Handle /status web service endpoint;
 * - return all the camera configuration settings
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


/**
 * Set a single camera configuration parameter using the /control endpoint
 * - uses a GET requests with two query parameters that both must be present
 *   - 'var' is the name of the configuration variable
 *   - 'val' is the value of the configuration variable to set
 */
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


