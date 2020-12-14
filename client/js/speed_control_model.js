
/**
 * Singleton to hold speed control state.
 */
const SpeedControlModel = (function() {
    const _defaultWheelState =  {
        minSpeed: 0.0,              // measured value for minium speed of motors
        maxSpeed: 0.0,              // measured value for maximum speed of motors 
        Kp: 0.0,                    // speed controller proportial gain
        Ki: 0.0,                    // speed controller integral gain
        Kd: 0.0,                    // speed controller derivative gain
    };
    let _useSpeedControl = false;
    let _wheel = [{..._defaultWheelState}, {..._defaultWheelState}];

    function useSpeedControl() { return _useSpeedControl; }
    function setUseSpeedControl(useSpeedControl) {
        _useSpeedControl = useSpeedControl;
        return self;
    }

    function minimumSpeed(wheelName) {
        return _wheel[Wheels.index(wheelName)].minSpeed;
    }
    function setMinimumSpeed(wheelName, minSpeed) {
        _wheel[Wheels.index(wheelName)].minSpeed = minSpeed;
        return self;
    }

    function maximumSpeed(wheelName) {
        return _wheel[Wheels.index(wheelName)].maxSpeed;
    }
    function setMaximumSpeed(wheelName, maxSpeed) {
        _wheel[Wheels.index(wheelName)].maxSpeed = maxSpeed;
        return self;
    }

    function Kp(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kp;
    }
    function setKp(wheelName, Kp) {
        _wheel[Wheels.index(wheelName)].Kp = Kp;
        return self;
    }

    function Ki(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kp;
    }
    function setKi(wheelName, Ki) {
        _wheel[Wheels.index(wheelName)].Ki = Ki;
        return self;
    }

    function Kd(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kd;
    }
    function setKd(wheelName, Kd) {
        _wheel[Wheels.index(wheelName)].Kd = Kd;
        return self;
    }

    /**
     * Convert wheel state to object
     * 
     * @param {string} wheelName 
     */
    function toObject(wheelName) {
        return {
            "useSpeedControl": useSpeedControl(wheelName),
            "minSpeed": minimumSpeed(wheelName),
            "maxSpeed": maximumSpeed(wheelName),
            "Kp": Kp(wheelName),
            "Ki": Ki(wheelName),
            "Kd": Kd(wheelName),
        };
    }


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