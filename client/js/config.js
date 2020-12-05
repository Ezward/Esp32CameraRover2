
/**
 * singleton that holds readonly configuration values.
 */
const config = function() {

    /**
     * @returns {number} - number of millisecnods to show
     *                     on the time axis of the pwm/speed
     *                     telemetry plot.
     */
    function telemetryPlotMs() { return 10000; }

    /**
     * @returns {number} - number of samples in telemetry buffer.
     */
    function telemetryBufferSize() { return 200; }

    function chartBackgroundColor() { return "black"; };
    function chartAxisColor() { return "white"; }
    function leftSpeedColor() { return "lightblue"; }
    function rightSpeedColor() { return "blue"; }
    function leftTargetColor() { return "lightgreen"; }
    function rightTargetColor() { return "green"; }
    function leftPwmColor() { return "lightyellow"; }
    function rightPwmColor() { return "yellow"; }

    const self = {
        "telemetryPlotMs": telemetryPlotMs,
        "telemetryBufferSize": telemetryBufferSize,
        "chartBackgroundColor": chartBackgroundColor,
        "chartAxisColor": chartAxisColor,
        "leftSpeedColor": leftSpeedColor,
        "rightSpeedColor": rightSpeedColor,
        "leftTargetColor": leftTargetColor,
        "rightTargetColor": rightTargetColor,
        "leftPwmColor": leftPwmColor,
        "rightPwmColor": rightPwmColor,
    }

    return self;
}();