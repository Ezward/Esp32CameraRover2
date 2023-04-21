/// <reference path="telemetry_model_listener.js" />

/** @typedef {"NOT_RUNNING"|"STARTING"|"RUNNING"|"ACHIEVED"} GotoGoalStateType */
/**
 * @typedef {object} GotoGoalModelObject
 * @property {GotoGoalStateType} state
 * @property {number} x  // x position
 * @property {number} y  // y position
 * @property {number} pointForward // point forward as fraction of wheelbase
 * @property {number} tolerance    // goal achieved when distance to goal <= tolerance
 */

/**
 * @implements {TelemetryModelType}
 * @typedef {object} GotoGoalModelType
 * @property {(key: string) => any} get
 * @property {(key: string, value: any) => void} set
 * @property {() => void} reset
 * @property {() => GotoGoalStateType} state
 * @property {(state: GotoGoalStateType) => GotoGoalModelType} setState
 * @property {() => number} x
 * @property {(x: number) => GotoGoalModelType} setX
 * @property {() => number} y
 * @property {(y: number) => GotoGoalModelType} setY
 * @property {() => number} tolerance
 * @property {(tolerance: number) => GotoGoalModelType} setTolerance
 * @property {() => number} pointForward
 * @property {(pointForward: number) => GotoGoalModelType} setPointForward
 * @property {() => GotoGoalModelObject} toObject
 */
/**
 * Singleton goto goal behavior state.
 * @returns {GotoGoalModelType}
 */
const GotoGoalModel = (function() {
    const NOT_RUNNING = "NOT_RUNNING";
    const STARTING = "STARTING";
    const RUNNING = "RUNNING";
    const ACHIEVED = "ACHIEVED";

    /** @type {GotoGoalModelObject} */
    const _defaultModel =  {
        state: NOT_RUNNING, // state
        x: 0,               // x position 
        y: 0,               // y position
        pointForward: 0.75, // point forward as fraction of wheelbase
        tolerance: 0,       // goal achieved when distance to goal <= tolerance
    };

    let _model = {..._defaultModel};

    /**
     * Get a value by key.
     * 
     * @param {string} key 
     * @returns {any}
     */
    function get(key) {
        if(_defaultModel.hasOwnProperty(key)) {
            return _model[key];
        }
        return undefined;
    }

    /**
     * Set a value by key.
     * 
     * @param {string} key 
     * @param {any} value 
     */
    function set(key, value) {
        if(_defaultModel.hasOwnProperty(key)) {
            _model[key] = value;
        }
    }

    /**
     * Reset the model to defaults.
     */
    function reset() {
        _model = {..._defaultModel};
    }

    /**
     * Get the goto goal current state.
     * 
     * @returns {GotoGoalStateType}
     */
    function state() {
        return _model.state;
    }

    /**
     * Set the model state.
     * 
     * @param {GotoGoalStateType} state 
     * @returns {GotoGoalModelType}
     */
    function setState(state) {
        _model.state = state;
        return self;
    }

    /**
     * Get goto goal x position.
     * 
     * @returns {number}
     */
    function x() {
        return _model.x;
    }

    /**
     * Set goto goal x position.
     * 
     * @param {number} x 
     * @returns {GotoGoalModelType} // RET: this GotoGoalModel for fluent chain calling.
     */
    function setX(x) {
        _model.x = x;
        return self;
    }

    /**
     * Get goto goal y position.
     * 
     * @returns {number}
     */
    function y() {
        return _model.y;
    }

    /**
     * Set goto goal y position.
     * 
     * @param {number} y 
     * @returns {GotoGoalModelType} // RET: this GotoGoalModel for fluent chain calling.
     */
    function setY(y) {
        _model.y = y;
        return self;
    }

    /**
     * Get the Goto Goal tolerance.
     * This is the distance to the goal that 
     * indicates that goal is achieved.
     * 
     * @returns {number}
     */
    function tolerance() {
        return _model.tolerance;
    }

    /**
     * Set the Goto Goal tolerance.
     * This is the distance to the goal that 
     * indicates that goal is achieved.
     * 
     * @param {number} tolerance 
     * @returns {GotoGoalModelType} // RET: this GotoGoalModel for fluent chain calling.
     */
    function setTolerance(tolerance) {
        _model.tolerance = tolerance;
        return self;
    }

    /**
     * Get the point forward as fraction of the wheelbase.
     * 
     * @returns {number}
     */
    function pointForward() {
        return _model.pointForward;
    }

    /**
     * Set the point forward as fraction of the wheelbase.
     * 
     * @param {number} pointForward 
     * @returns {GotoGoalModelType} // RET: this GotoGoalModel for fluent chain calling.
     */
    function setPointForward(pointForward) {
        _model.pointForward = pointForward;
        return self;
    }

    /**
     * Convert Goto Goal model to object.
     * 
     * @returns {GotoGoalModelObject}
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

    /** @typedef {GotoGoalModelType} */
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