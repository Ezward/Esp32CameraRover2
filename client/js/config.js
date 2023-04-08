
const WHEEL_ID = {
    "left": 1,
    "right": 2,
};
const WHEEL_NAME = [
    "left",
    "right"
];

const WHEEL_COUNT = WHEEL_NAME.length

/**
 * Given a wheel name, return the wheel number.
 * 
 * NOTE: Wheel numbers begin at 1.
 * 
 * @param {string} wheelName     // IN : wheel's name
 * @returns {number | undefined} // RET: if the wheelName is valid then return the wheel number
 *                                       otherwise return undefined.
 */
function wheelNumber(wheelName) {
    return WHEEL_ID[wheelName];
}

/**
 * Given a wheel number, return the wheel name.
 * 
 * NOTE: Wheel numbers begin at 1.
 * 
 * @param {number} wheelNumber   // IN : wheel number
 * @returns {string | undefined} // RET: if wheel number is valid, then return wheel name
 *                                       otherwise return undefined
 */
function wheelName(wheelNumber) {
    return WHEEL_NAME[wheelNumber - 1];
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