#include "analogWrite.h"

analog_write_channel_t _analog_write_channels[16] = {
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13},
    {-1, 5000, 13}};

//
// assign a gpio pin to a PWM channel
//
int analogWriteChannel(
    uint8_t pin, // IN : gpio pin to assign to channel
    int channel) // IN : channel to assign
                 //      or -1 to choose first available channel
                 // RET: channel number for pin,
                 //      -1 if pin could not be assigned channel
{

    // Check if pin already attached to a channel
    if (channel == -1)
    {
        for (uint8_t i = 0; i < 16; i++)
        {
            if (_analog_write_channels[i].pin == pin)
            {
                channel = i;
                break;
            }
        }
    }

    // If not, attach it to a free channel
    if (channel == -1)
    {
        for (uint8_t i = 0; i < 16; i++)
        {
            if (_analog_write_channels[i].pin == -1)
            {
                channel = i;
                break;
            }
        }
    }

    if (channel != -1)
    {
        _analog_write_channels[channel].pin = pin;
        ledcSetup(channel, _analog_write_channels[channel].frequency, _analog_write_channels[channel].resolution);
        ledcAttachPin(pin, channel);
    }

    return channel;
}

void analogWriteFrequency(double frequency)
{
    for (uint8_t i = 0; i < 16; i++)
    {
        _analog_write_channels[i].frequency = frequency;
    }
}

void analogWriteFrequency(uint8_t pin, double frequency)
{
    int channel = analogWriteChannel(pin);

    // Make sure the pin was attached to a channel, if not do nothing
    if (channel != -1 && channel < 16)
    {
        _analog_write_channels[channel].frequency = frequency;
    }
}

void analogWriteResolution(uint8_t resolution)
{
    for (uint8_t i = 0; i < 16; i++)
    {
        _analog_write_channels[i].resolution = resolution;
    }
}

void analogWriteResolution(uint8_t pin, uint8_t resolution)
{
    int channel = analogWriteChannel(pin);

    // Make sure the pin was attached to a channel, if not do nothing
    if (channel != -1 && channel < 16)
    {
        _analog_write_channels[channel].resolution = resolution;
    }
}

void analogWrite(uint8_t pin, uint32_t value, uint32_t valueMax)
{
    int channel = analogWriteChannel(pin);

    // Make sure the pin was attached to a channel, if not do nothing
    if (channel != -1 && channel < 16)
    {
        uint8_t resolution = _analog_write_channels[channel].resolution;
        uint32_t levels = pow(2, resolution);
        uint32_t duty = ((levels - 1) / valueMax) * min(value, valueMax);

        // write duty to LEDC
        ledcWrite(channel, duty);
    }
}
