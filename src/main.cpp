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
#include "camera_index.h"
#include "camera_wrap.h"

#include "strcopy.h"

#define DEBUG
#ifdef DEBUG
  #define LOG(_s_) do{Serial.println(_s_);}while(0)
#else
  #define LOG(_s_) do{/* no-op */}while(0)
#endif

#define MIN(x, y) (((x) <= (y)) ? (x) : (y))
#define MAX(x, y) (((x) >= (y)) ? (x) : (y))
#define ABS(x) (((x) >= 0) ? (x) : -(x))

//
// control pins for the L9110S motor controller
//
#include "rover.h"
const int A1_A_PIN = 15;
const int A1_B_PIN = 13;
const int B1_A_PIN = 2;
const int B1_B_PIN = 14;

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


// create the http server and websocket server
AsyncWebServer server(80);
WebSocketsServer wsStream = WebSocketsServer(81);
WebSocketsServer wsCommand = WebSocketsServer(82);

// 404 handler
void notFound(AsyncWebServerRequest *request)
{
    request->send(404, "text/plain", "Not found");
}

// websocket message handler
void wsStreamEvent(uint8_t clientNum, WStype_t type, uint8_t * payload, size_t length);
void wsCommandEvent(uint8_t clientNum, WStype_t type, uint8_t * payload, size_t length);

void setup()
{
    // 
    // init serial monitor
    //
    Serial.begin(115200);
    Serial.setDebugOutput(true);
    Serial.println();

    //
    // initialize motor output pins
    //
    roverInit(A1_A_PIN, A1_B_PIN, B1_B_PIN, B1_A_PIN);

    // 
    // init wifi
    //
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    if (WiFi.waitForConnectResult() != WL_CONNECTED)
    {
        LOG("WiFi Failed!\n");
        return;
    }

    LOG("Server running on IP Address: " + WiFi.localIP());

    //
    // init web server
    //

    // endpoints to return the compressed html/css/javascript for running the rover
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        LOG("handling " + request->url());
        AsyncWebServerResponse *response = request->beginResponse_P(200, "text/html", index_ov2640_html_gz, sizeof(index_ov2640_html_gz));
        response->addHeader("Content-Encoding", "gzip");
        request->send(response);
    });
    server.on("/bundle.css", HTTP_GET, [](AsyncWebServerRequest *request) {
        LOG("handling " + request->url());
        AsyncWebServerResponse *response = request->beginResponse_P(200, "text/css", bundle_css_gz, sizeof(bundle_css_gz));
        response->addHeader("Content-Encoding", "gzip");
        request->send(response);
    });
    server.on("/bundle.js", HTTP_GET, [](AsyncWebServerRequest *request) {
        LOG("handling " + request->url());
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

    //
    // init websockets
    //
    wsStream.begin();
    wsStream.onEvent(wsStreamEvent);
    wsCommand.begin();
    wsCommand.onEvent(wsCommandEvent);

    //
    // create background task to execute queued rover tasks
    //
    xTaskCreate(roverTask, "roverTask", 1024, NULL, 1, &roverTaskHandle);

    //
    // initialize the camera
    //
    initCamera();
}

void healthHandler(AsyncWebServerRequest *request)
{
    LOG("handling " + request->url());

    // TODO: determine if camera and rover are healty
    request->send(200, "application/json", "{\"health\": \"ok\"}");
}

//
// handle /capture
//
void captureHandler(AsyncWebServerRequest *request)
{
    LOG("handling " + request->url());

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
    LOG("handling " + request->url());
    request->send(501, "text/plain", "not implemented");
}

int cameraClientId = -1;        // websocket client id for camera streaming
bool isCameraStreamOn = false;  // true if streaming, false if not

int commandClientId = -1;       // websocket client id for rover commands
bool isCommandSocketOn = false; // true if command socket is ready

//
// send the given image buffer down the websocket
//
int sendImage(uint8_t *imageBuffer, size_t bufferSize) {
    if (wsStream.sendBIN(cameraClientId, imageBuffer, bufferSize)) {
        return SUCCESS;
    }
    return FAILURE;
}

//
// get a camera image and send it down websocket
//
void streamCameraImage() {
    if (isCameraStreamOn && (cameraClientId >= 0)) {
        //
        // grab and image and call sendImage on it
        //
        esp_err_t result = processImage(sendImage);
        if (SUCCESS != result) {
            LOG("Failure grabbing and sending image.");
        }
    }
}


/******************************************************/
/*************** main loop ****************************/
/******************************************************/
void loop()
{
    wsCommand.loop(); // keep websockets alive
    wsStream.loop();  // keep websockets alive

    // send image to clients via websocket
    streamCameraImage();
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
    LOG("handling " + request->url());

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
        || (SUCCESS != submitRoverCommand(directionParam.c_str(), speedParam.c_str())))
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
    uint8_t directionCommand;
    uint8_t speedCommand;

    for(;;) 
    {
        if (SUCCESS == dequeueRoverCommand(&directionCommand, &speedCommand)) {
            executeRoverCommand(directionCommand, speedCommand);
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
    LOG("handling " + request->url());

    const String json = getCameraPropertiesJson();
    request->send_P(200, "application/json", (uint8_t *)json.c_str(), json.length());
}


//
// handle /control
//
void configHandler(AsyncWebServerRequest *request) {
    LOG("handling " + request->url());

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
        request->send((SUCCESS == status) ? 200: 500);
    }
}


//////////////////////////////////////
///////// websocket server ///////////
//////////////////////////////////////
void logWsEvent(
    const char *event,  // IN : name of event as null terminated string
    const int id)       // IN : client id to copy
{
    #ifdef DEBUG
        char msg[128];
        strCopyIntAt(msg, sizeof(msg), strCopy(msg, sizeof(msg), event), id);
        LOG(msg);
    #endif
}

void wsStreamEvent(uint8_t clientNum, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_CONNECTED: {
            logWsEvent("wsStreamEvent.WS_EVT_CONNECT", clientNum);
            wsStream.sendPing(clientNum, (uint8_t *)"ping", sizeof("ping"));
            return;
        }
        case WStype_DISCONNECTED: {
            // os_printf("wsStream[%s][%u] disconnect: %u\n", server->url(), client->id());
            logWsEvent("wsStreamEvent.WS_EVT_DISCONNECT", clientNum);
            if (cameraClientId == clientNum) {
                cameraClientId = -1;
                isCameraStreamOn = false;
            }
            return;
        } 
        case WStype_PONG: {
            logWsEvent("wsStreamEvent.WStype_PONG", clientNum);
            cameraClientId = clientNum;
            isCameraStreamOn = true;
            return;
        }
        case WStype_BIN: {
            logWsEvent("wsStreamEvent.WStype_BIN", clientNum);
            return;
        }
        case WStype_TEXT: {
            char buffer[128];
            int offset = strCopy(buffer, sizeof(buffer), "wsStreamEvent.WStype_TEXT: ");
            strCopySizeAt(buffer, sizeof(buffer), offset, (char *)payload, length);
            logWsEvent(buffer, clientNum);
            return;
        }
        default: {
            logWsEvent("wsStreamEvent.UNHANDLED EVENT: ", clientNum);
            return;
        }
    }
}


void wsCommandEvent(uint8_t clientNum, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_CONNECTED: {
            logWsEvent("wsCommandEvent.WS_EVT_CONNECT", clientNum);
            wsStream.sendPing(clientNum, (uint8_t *)"ping", sizeof("ping"));
            return;
        }
        case WStype_DISCONNECTED: {
            // os_printf("wsStream[%s][%u] disconnect: %u\n", server->url(), client->id());
            logWsEvent("wsCommandEvent.WS_EVT_DISCONNECT", clientNum);
            if (commandClientId == clientNum) {
                commandClientId = -1;
                isCommandSocketOn = false;
            }
            return;
        } 
        case WStype_PONG: {
            logWsEvent("wsCommandEvent.WStype_PONG", clientNum);
            commandClientId = clientNum;
            isCommandSocketOn = true;
            return;
        }
        case WStype_BIN: {
            logWsEvent("wsCommandEvent.WStype_BIN", clientNum);
            return;
        }
        case WStype_TEXT: {
            char buffer[128];
            int offset = strCopy(buffer, sizeof(buffer), "wsCommandEvent.WStype_TEXT: ");
            strCopySizeAt(buffer, sizeof(buffer), offset, (char *)payload, length);
            logWsEvent(buffer, clientNum);
            return;
        }
        default: {
            logWsEvent("wsCommandEvent.UNHANDLED EVENT: ", clientNum);
            return;
        }
    }
}
