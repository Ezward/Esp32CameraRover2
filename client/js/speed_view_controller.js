
// import RollbackState from './rollback_state.js'
// import ViewStateTools from './view_state_tools.js'
// import ViewValidationTools from './view_validation_tools.js'
// import ViewWidgetTools from './view_widget_tools.js'
// import RangeWidgetController from './range_widget_controller.js'
// import wheelNumber from './config.js'

//
// view controller for speed control tab panel
//
/**
 * View controller for speed control tab panel
 * 
 * @param {RoverCommand} roverCommand 
 * @param {string} cssContainer 
 * @param {string} cssControlMode 
 * @param {string[]} cssMinSpeed - // IN : min-speed input selector for each wheel
 * @param {string[]} cssMaxSpeed - // IN : max speed input selector for each wheel
 * @param {string[]} cssKpInput  - // IN : Kp gain input selector for each wheel
 * @param {string[]} cssKiInput 
 * @param {string[]} cssKdInput 
 */
function SpeedViewController(
    roverCommand, 
    cssContainer, cssControlMode, 
    cssMinSpeed, cssMaxSpeed, 
    cssKpInput, cssKiInput, cssKdInput) // IN : RangeWidgetController selectors
{

    const defaultState = {
        useSpeedControl: false,     // true to have rover use speed control
                                    // false to have rover use raw pwm values with no control
        minSpeed: 0.0,              // measured value for minium speed of motors
                                    // (speed below which the motor stalls)
        minSpeedValid: false,       // true if min speed control contains a valid value
                                    // false if min speed control contains an invalid value
        maxSpeed: 0.0,              // measured value for maximum speed of motors 
                                    // (it is best to choose the lowest maximum of the two motors)
        maxSpeedValid: false,       // true if max speed control contains a valid value
                                    // false if max speed control contains an invalid value
        Kp: 0.0,                    // speed controller proportial gain
        Ki: 0.0,                    // speed controller integral gain
        Kd: 0.0,                    // speed controller derivative gain
        KpValid: true,              // true if proportial gain contains a valid value
                                    // false if not
        KiValid: true,              // true if integral gain contains a valid value
                                    // false if not
        KdValid: true,              // true if derivative gain contains a valid value
                                    // false if not
    };

    // separate state for each wheel
    const _state = [
        RollbackState(defaultState), 
        RollbackState(defaultState)
    ];

    let _container = undefined;
    let _speedControlCheck = undefined;
    let _minSpeedText = undefined;
    let _maxSpeedText = undefined;
    let _KpGainText = undefined;
    let _KiGainText = undefined;
    let _KdGainText = undefined;

    let _model = undefined;

    let _sendSpeedControl = false;
    let _useSpeedControlChanged = false;
    let _lastSendMs = 0;


    /**
     * Determine if there is a model
     * bound for updating.
     * 
     * @returns {boolean} // RET: true if model is bound, false if not
     */
    function isModelBound() {
        return !!_model;
    }

    /**
     * Bind the model, so we can update it
     * when the view is committed.
     * 
     * @param {object} speedControlModel // IN : SpeedControlModel to bind
     * @returns {object}                 // RET: this SpeedViewController
     */
    function bindModel(speedControlModel) {
        if(isModelBound()) throw Error("bindModel called before unbindModel");
        if(typeof speedControlModel !== "object") throw TypeError("missing SpeedControlModel");

        // intialize the _state from the _model
        _model = speedControlModel;
        for(let i = 0; i < _state.length; i += 1) {
            const wheelState = _state[i];
            const wheelName = Wheels.name(i);
            wheelState.setValue("useSpeedControl", _model.useSpeedControl());
            wheelState.setValue("minSpeed", _model.minimumSpeed(wheelName));
            wheelState.setValue("maxSpeed", _model.maximumSpeed(wheelName));
            wheelState.setValue("Kp", _model.Kp(wheelName));
            wheelState.setValue("Ki", _model.Ki(wheelName));
            wheelState.setValue("Kd", _model.Kd(wheelName));
        }

        return self;
    }

    /**
     * unbind the model
     */
    function unbindModel() {
        _model = undefined;
        return self;
    }
            
    function isViewAttached() // RET: true if view is in attached state
    {
        return !!_container;
    }

    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);

        _speedControlCheck = _container.querySelector(cssControlMode);

        // cssXxxx is a list of selectors
        _minSpeedText = cssMinSpeed.map(selector => _container.querySelector(selector));
        _maxSpeedText = cssMaxSpeed.map(selector => _container.querySelector(selector));
        _KpGainText = cssKpInput.map(selector => _container.querySelector(selector));
        _KiGainText = cssKiInput.map(selector => _container.querySelector(selector));
        _KdGainText = cssKdInput.map(selector => _container.querySelector(selector));

        updateView(true);   // sync view with state

        return self;
    }

    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if (isViewAttached()) {
            _container = undefined;
            _speedControlCheck = undefined;
            _minSpeedText = undefined;
            _maxSpeedText = undefined;
            _KpGainText = undefined;
            _KiGainText = undefined;
            _KdGainText = undefined;
        }
        return self;
    }

    let _listening = 0;
    function isListening() {
        return _listening > 0;
    }

    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            if(isViewAttached()) {
                _speedControlCheck.addEventListener("change", _onSpeedControlChecked);

                // each of these is a list of elements
                _minSpeedText.forEach(e => e.addEventListener("input", _onMinSpeedChanged));
                _maxSpeedText.forEach(e => e.addEventListener("input", _onMaxSpeedChanged));
                _KpGainText.forEach(e => e.addEventListener("input", _onKpGainChanged));
                _KiGainText.forEach(e => e.addEventListener("input", _onKiGainChanged));
                _KdGainText.forEach(e => e.addEventListener("input", _onKdGainChanged));
            }
        }

        if(isListening()) {
            _updateLoop(performance.now());
        }

        return self;
    }

    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {

            if(isViewAttached()) {
                _speedControlCheck.removeEventListener("change", _onSpeedControlChecked);

                // each of these is a list of elements
                _minSpeedText.forEach(e => e.removeEventListener("input", _onMinSpeedChanged));
                _maxSpeedText.forEach(e => e.removeEventListener("input", _onMaxSpeedChanged));
                _KpGainText.forEach(e => e.removeEventListener("input", _onKpGainChanged));
                _KiGainText.forEach(e => e.removeEventListener("input", _onKiGainChanged));
                _KdGainText.forEach(e => e.removeEventListener("input", _onKdGainChanged));
            }
            window.cancelAnimationFrame(_updateLoop);
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    function isViewShowing() {
        return _showing > 0;
    }

    function showView() {
        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    //
    // render/update view
    //
    /**
     * Update view state and render if changed.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns this SpeedViewController
     */
    function updateView(force = false) {
        // make sure live state matches state of record
        _enforceView(force);
        return self;
    }

    function _onSpeedControlChecked(event) {
        // update state to cause a redraw on game loop
        _state.forEach(s => s.setValue("useSpeedControl", event.target.checked));
    }

    /**
     * Select the correct _state[x] given selectors and an id.
     * 
     * @param {string} selectors            // IN : list of selectors to check
     * @param {string} id                   // IN : element id
     * @returns {RollbackState|undefined}   // RET: rollback state if a selector matches id
     *                                      //      or undefined if no selector matches id
     */
    function _selectState(selectors, id) {
        for(let i = 0; i < selectors.length; i += 1) {
            if(selectors[i] === ("#" + id)) {
                return _state[i];
            }
        }
        return undefined;
    }

    function _onMinSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssMinSpeed, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "minSpeed", "minSpeedValid", event.target.value, 0.0);
        }
    }

    function _onMaxSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssMaxSpeed, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "maxSpeed", "maxSpeedValid", event.target.value, 0.0);
        }
    }

    function _onKpGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKpInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Kp", "KpValid", event.target.value);
        }
    }
    function _onKiGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKiInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Ki", "KiValid", event.target.value);
        }
    }
    function _onKdGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKdInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Kd", "KdValid", event.target.value);
        }
    }

    /**
     * Make the view match the state.
     * 
     * @param {boolean} force 
     */
    function _enforceView(force = false) {
        //
        // if any of the speed control parameters change, 
        // then send them to the rover.
        //
        // if the useSpeedControl changes, we want to force sending of 'off'
        //
        _useSpeedControlChanged = ViewStateTools.enforceCheck(_state[0], "useSpeedControl", _speedControlCheck, force) || _useSpeedControlChanged;
        _sendSpeedControl = _useSpeedControlChanged || _sendSpeedControl;

        for(let i = 0; i < _state.length; i += 1) {
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "maxSpeed", _maxSpeedText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "maxSpeedValid", _maxSpeedText[i], force); // make text input red if invalid
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "minSpeed", _minSpeedText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "minSpeedValid", _minSpeedText[i], force); // make text input red if invalid
            
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "Kp", _KpGainText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "KpValid", _KpGainText[i], force); // make text input red if invalid
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "Ki", _KiGainText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "KiValid", _KiGainText[i], force); // make text input red if invalid
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "Kd", _KdGainText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "KdValid", _KdGainText[i], force); // make text input red if invalid
        }
    }

    /**
     * Write changes to speed control parameters
     * to the rover.
     */
    function _syncSpeedControl() {
        if(_sendSpeedControl) {
            if(roverCommand) {
                // rate limit to once per second
                const now = new Date();
                if(now.getTime() >= (_lastSendMs + 1000)) {
                    const useSpeedControl = _state[0].getValue("useSpeedControl");
                    if(typeof useSpeedControl == "boolean") {
                        if(useSpeedControl) {
                            // only send valid data
                            for(let i = 0; i < _state.length; i += 1) {
                                const minSpeed = _state[i].getValue("minSpeed");
                                const maxSpeed = _state[i].getValue("maxSpeed");
                                const Kp = _state[i].getValue("Kp")
                                const Ki = _state[i].getValue("Ki")
                                const Kd = _state[i].getValue("Kd")
                                if(isValidNumber(minSpeed, 0) 
                                    && isValidNumber(maxSpeed, minSpeed, undefined, true)
                                    && isValidNumber(Kp)
                                    && isValidNumber(Ki)
                                    && isValidNumber(Kd)) 
                                {
                                    roverCommand.syncSpeedControl(
                                        Wheels.id(i),   // bit flag for wheel
                                        true,
                                        minSpeed, maxSpeed, 
                                        Kp, Ki, Kd);

                                    _useSpeedControlChanged = false;
                                    _sendSpeedControl = false;
                                    _lastSendMs = now.getTime();

                                    // publish settings change
                                    if(isModelBound()) {
                                        const wheelName = Wheels.name(i);
                                        _model.setUseSpeedControl(wheelName, useSpeedControl);
                                        _model.setMinimumSpeed(wheelName, minSpeed);
                                        _model.setMaximumSpeed(wheelName, maxSpeed);
                                        _model.setKp(wheelName, Kp);
                                        _model.setKi(wheelName, Ki);
                                        _model.setKd(wheelName, Kd);
                                    }
                                }
                            }
                        } else if(_useSpeedControlChanged){
                            //
                            // if useSpeedControl is off, the only change we care
                            // about is if useSpeedControl itself changed
                            //
                            roverCommand.syncSpeedControl(Wheels.id("left") + Wheels.id("right"), false, 0, 0, 0, 0);
                            _useSpeedControlChanged = false;
                            _sendSpeedControl = false;
                            _lastSendMs = now.getTime();

                            // publish settings change
                            if(isModelBound()) {
                                _model.setUseSpeedControl(false);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * called periodically to 
     * - update the view
     * - sync new values to rover
     * 
     * @param {*} timeStamp 
     */
    function _updateLoop(timeStamp) {
        updateView();
        _syncSpeedControl();

        if (isListening()) {
            window.requestAnimationFrame(_updateLoop);
        }
    }


    const self = {
        "isModelBound": isModelBound,
        "bindModel": bindModel,
        "unbindModel": unbindModel,
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "updateView": updateView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
    }
    return self;
}