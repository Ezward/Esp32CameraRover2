

const GotoGoalModel = (function() {
    const NOT_RUNNING = "NOT_RUNNING";
    const STARTING = "STARTING";
    const RUNNING = "RUNNING";
    const ACHIEVED = "ACHIEVED";

    const _defaultModel =  {
        state: NOT_RUNNING, // measured value for minium speed of motors
        x: 0,               // measured value for maximum speed of motors 
        y: 0,               // speed controller proportial gain
        pointForward: 0.75, // point forward as fraction of wheelbase
        tolerance: 0,       // speed controller integral gain
    };

    let _model = {..._defaultModel};

    function get(key) {
        if(_defaultModel.hasOwnProperty(key)) {
            return _model[key];
        }
        return undefined;
    }
    function set(key, value) {
        if(_defaultModel.hasOwnProperty(key)) {
            _model[key] = value;
        }
    }
    function reset() {
        _model = {..._defaultModel};
    }

    function state() {
        return _model.state;;
    }
    function setState(state) {
        _model.state = state;
        return self;
    }

    function x() {
        return _model.x;
    }
    function setX(x) {
        _model.x = x;
        return self;
    }

    function y() {
        return _model.y;
    }
    function setY(y) {
        _model.y = y;
        return self;
    }

    function tolerance() {
        return _model.tolerance;
    }
    function setTolerance(tolerance) {
        _model.tolerance = tolerance;
        return self;
    }

    function pointForward() {
        return _model.pointForward;
    }
    function setPointForward(pointForward) {
        _model.pointForward = pointForward;
        return self;
    }

    /**
     * Convert wheel state to object
     */
    function toObject() {
        return {
            "state": state(),
            "x": x(),
            "y": y(),
            "pointForward": pointForward(),
            "tolerance": tolerance(),
        };
    }


    const self = {
        "get": get,
        "set": set,
        "reset": reset,
        "state": state,
        "setState": setState,
        "x": x,
        "setX": setX,
        "y": y,
        "setY": setY,
        "pointForward": pointForward,
        "setPointForward": setPointForward,
        "tolerance": tolerance,
        "setTolerance": setTolerance,
        "toObject": toObject,
    }
    return self;

})();