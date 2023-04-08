/// <reference path="config.js" />
/// <reference path="wheels.js" />

/**
 * @typedef WheelControlValues
 * @property {number} minSpeed  // measured value for minium speed of motors
 * @property {number} maxSpeed  // measured value for maximum speed of motors
 * @property {number} Kp        // speed controller proportial gain
 * @property {number} Ki        // speed controller integral gain
 * @property {number} Kd        // speed controller derivative gain
 */

/**
 * @typedef SpeedControlValues
 * @property {boolean} useSpeedControl
 */

/**
 * @typedef {object} SpeedControlModelType
 * @property {() => boolean} useSpeedControl
 * @property {(useSpeedControl: boolean) => SpeedControlModelType} setUseSpeedControl
 * @property {(wheelName: string) => number} minimumSpeed
 * @property {(wheelName: string, minSpeed: number) => SpeedControlModelType} setMinimumSpeed
 * @property {(wheelName: string) => number} maximumSpeed
 * @property {(wheelName: string, maxSpeed: number) => SpeedControlModelType} setMaximumSpeed
 * @property {(wheelName: string) => number} Kp
 * @property {(wheelName: string, Kp: number) => SpeedControlModelType} setKp
 * @property {(wheelName: string) => number} Ki
 * @property {(wheelName: string, Ki: number) => SpeedControlModelType} setKi
 * @property {(wheelName: string) => number} Kd
 * @property {(wheelName: string, Kd: number) => SpeedControlModelType} setKd
 * @property {(wheelName: string) => SpeedControlValues & WheelControlValues} toObject
 */

/**
 * Singleton to hold speed control state.
 * 
 * @type {SpeedControlModelType}
 */
const SpeedControlModel = (function() {

    /** @type {WheelControlValues} */
    const _defaultControlValues =  {
        minSpeed: 0.0,              // measured value for minium speed of motors
        maxSpeed: 0.0,              // measured value for maximum speed of motors 
        Kp: 0.0,                    // speed controller proportial gain
        Ki: 0.0,                    // speed controller integral gain
        Kd: 0.0,                    // speed controller derivative gain
    };

    /** @type {WheelControlValues[]} */
    let _wheel = [{..._defaultControlValues}, {..._defaultControlValues}];
    let _useSpeedControl = false;

    /**
     * Determine is speed control is used.
     * @returns {boolean} true if speed control is in use, false otherwise
     */
    function useSpeedControl() { return _useSpeedControl; }

    /**
     * Turn speed control on or off.
     * 
     * @param {boolean} useSpeedControl  // IN : true to turn speed control on,
     *                                           false to turn speed control off.
     * @returns {SpeedControlModelType}  // RET: self for fluent chain calls
     */
    function setUseSpeedControl(useSpeedControl) {
        _useSpeedControl = useSpeedControl;
        return self;
    }

    /**
     * Get the minimum speed control value for given wheel.
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function minimumSpeed(wheelName) {
        return _wheel[Wheels.index(wheelName)].minSpeed;
    }

    /**
     * Set minimum speed control value for the given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} minSpeed 
     * @returns {SpeedControlModelType}  // RET: self for fluent chain calls
     */
    function setMinimumSpeed(wheelName, minSpeed) {
        _wheel[Wheels.index(wheelName)].minSpeed = minSpeed;
        return self;
    }

    /**
     * Get maximum speed control value for given wheel
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function maximumSpeed(wheelName) {
        return _wheel[Wheels.index(wheelName)].maxSpeed;
    }

    /**
     * Set maximum speed control value for given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} maxSpeed 
     * @returns {SpeedControlModelType} // RET: self for fluent chain calling.
     */
    function setMaximumSpeed(wheelName, maxSpeed) {
        _wheel[Wheels.index(wheelName)].maxSpeed = maxSpeed;
        return self;
    }

    /**
     * Get proportial gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function Kp(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kp;
    }

    /**
     * Set proportional gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} Kp 
     * @returns {SpeedControlModelType} // RET: self for fluent chain calls.
     */
    function setKp(wheelName, Kp) {
        _wheel[Wheels.index(wheelName)].Kp = Kp;
        return self;
    }

    /**
     * Get integral gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function Ki(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kp;
    }

    /**
     * Set integral gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} Ki 
     * @returns {SpeedControlModelType} // RET: self for fluent chain calls.
     */
    function setKi(wheelName, Ki) {
        _wheel[Wheels.index(wheelName)].Ki = Ki;
        return self;
    }

    /**
     * Get derivative gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function Kd(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kd;
    }

    /**
     * Set derivative gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} Kd
     * @returns {SpeedControlModelType} // RET: self for fluent chain calls.
     */
    function setKd(wheelName, Kd) {
        _wheel[Wheels.index(wheelName)].Kd = Kd;
        return self;
    }

    /**
     * Convert wheel state to object
     * 
     * @param {string} wheelName 
     * @returns {SpeedControlValues & WheelControlValues}
     */
    function toObject(wheelName) {
        return {
            "useSpeedControl": useSpeedControl(),
            "minSpeed": minimumSpeed(wheelName),
            "maxSpeed": maximumSpeed(wheelName),
            "Kp": Kp(wheelName),
            "Ki": Ki(wheelName),
            "Kd": Kd(wheelName),
        };
    }

    /** @type {SpeedControlModelType} */
    const self = {
        "useSpeedControl": useSpeedControl,
        "setUseSpeedControl": setUseSpeedControl,
        "minimumSpeed": minimumSpeed,
        "setMinimumSpeed": setMinimumSpeed,
        "maximumSpeed": maximumSpeed,
        "setMaximumSpeed": setMaximumSpeed,
        "Kp": Kp,
        "setKp": setKp,
        "Ki": Ki,
        "setKi": setKi,
        "Kd": Kd,
        "setKd": setKd,
        "toObject": toObject,
    }
    return self;
})();