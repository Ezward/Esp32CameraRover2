const WHEEL_ID = {
    "left": 1,
    "right": 2,
};
function wheelNumber(wheelName) {
    return WHEEL_ID[wheelName];
}


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
    function poseTelemetrySize() { return 200; }

    function chartBackgroundColor() { return "#181818" /*"#363636"*/; };
    function chartAxisColor() { return "#EFEFEF"; }
    function leftSpeedColor() { return "lightblue"; }
    function rightSpeedColor() { return "blue"; }
    function leftTargetColor() { return "lightgreen"; }
    function rightTargetColor() { return "green"; }
    function leftPwmColor() { return "lightyellow"; }
    function rightPwmColor() { return "yellow"; }
    function poseLineColor() { return "pink"; }
    function posePointColor() { return "red"; }
    function averageSpeedMs() { return 2000; }

    const self = {
        "telemetryPlotMs": telemetryPlotMs,
        "telemetryBufferSize": telemetryBufferSize,
        "poseTelemetrySize": poseTelemetrySize,
        "chartBackgroundColor": chartBackgroundColor,
        "chartAxisColor": chartAxisColor,
        "leftSpeedColor": leftSpeedColor,
        "rightSpeedColor": rightSpeedColor,
        "leftTargetColor": leftTargetColor,
        "rightTargetColor": rightTargetColor,
        "leftPwmColor": leftPwmColor,
        "rightPwmColor": rightPwmColor,
        "poseLineColor": poseLineColor,
        "posePointColor": posePointColor,
        "averageSpeedMs": averageSpeedMs,
    }

    return self;
}();