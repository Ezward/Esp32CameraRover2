#ifndef CAMERA_WRAP_H
#define CAMERA_WRAP_H

#include <Arduino.h>
#include <string.h>

#include "esp_camera.h"

extern int initCamera();
extern esp_err_t grabImage( size_t& jpg_buf_len, uint8_t *jpg_buf);
extern String getCameraPropertiesJson();
extern int setCameraProperty(String varParam, String valParam);

#endif