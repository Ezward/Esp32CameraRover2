#include <Arduino.h>
#ifdef ESP32
#include <AsyncTCP.h>
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#endif
#include <ESPAsyncWebServer.h>

// gzipped html content
#include "camera_index.h"

//
// control pins for the L9110S motor controller
//
#include "rover.h"
const int AIA_PIN = 15;
const int AIB_PIN = 13;
const int BIA_PIN = 2;
const int BIB_PIN = 14;

//
// put ssid and password in wifi_credentials.h
// and do NOT check that into source control.
//
#include "wifi_credentials.h"
//const char* ssid = "******";
//const char* password = "******";

void rover_handler(AsyncWebServerRequest *request);
void roverTask(void *params);
TaskHandle_t roverTaskHandle;

// create the server
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
    Serial.begin(115200);
    Serial.setDebugOutput(true);
    Serial.println();

    //
    // initialize motor output pins
    //
    roverInit(AIA_PIN, AIB_PIN, BIA_PIN, BIB_PIN);

    // 
    // init wifi
    //
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    if (WiFi.waitForConnectResult() != WL_CONNECTED)
    {
        Serial.printf("WiFi Failed!\n");
        return;
    }

    Serial.print("Server running on IP Address: ");
    Serial.println(WiFi.localIP());

    //
    // init web server
    //
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        AsyncWebServerResponse *response = request->beginResponse_P(200, "text/html", index_ov2640_html_gz, sizeof(index_ov2640_html_gz));
        response->addHeader("Content-Encoding", "gzip");

        request->send(response);
    });

    server.on("/rover", HTTP_GET, rover_handler);

    server.onNotFound(notFound);

    server.begin();

    //
    // create background task to execute queued rover tasks
    //
    xTaskCreate(roverTask, "roverTask", 1024, NULL, 1, &roverTaskHandle);
}

/******************************************************/
/*************** main loop ****************************/
/******************************************************/

void loop()
{
    delay(5000);
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
void rover_handler(AsyncWebServerRequest *request)
{
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
    int count = 0;

    for(;;) 
    {
        if (SUCCESS == dequeueRoverCommand(&directionCommand, &speedCommand)) {
            executeRoverCommand(directionCommand, speedCommand);
        }
    }
}
