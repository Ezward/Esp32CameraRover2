
// import RollbackState from './rollback_state.js'
// import ViewStateTools from './view_state_tools.js'
// import ViewValidationTools from './view_validation_tools.js'
// import ViewWidgetTools from './view_widget_tools.js'
// import RangeWidgetController from './range_widget_controller.js'

//
// view controller for speed control tab panel
//
/**
 * View controller for speed control tab panel
 * 
 * @param {RoverCommand} roverCommand 
 * @param {string} cssContainer 
 * @param {string} cssControlMode 
 * @param {string} cssMaxSpeed 
 * @param {string} cssKpInput 
 * @param {string} cssKiInput 
 * @param {string} cssKdInput 
 */
function SpeedViewController(
    roverCommand, 
    cssContainer, cssControlMode, cssMaxSpeed, 
    cssKpInput, cssKiInput, cssKdInput) // IN : RangeWidgetController selectors
{

    const _state = RollbackState({
        useSpeedControl: false,     // true to have rover us speed control
                                    // false to have rover use raw pwm values with no control
        maxSpeed: 0,                // measured value for maximum speed of motors 
                                    // (it is best to choose the lowest maximum of the two motors)
        maxSpeedValid: false,       // true if max speed control contains a valid value
                                    // false if max speed control contains an invalid value
        Kp: 0.0,                    // speed controller proportial gain
        Ki: 0.0,                    // speed controller integral gain
        Kd: 0.0,                    // speed controller derivative gain
        KpLive: 0.0,                // proportial gain live update
        KiLive: 0.0,                // integral gain live update
        KdLive: 0.0,                // derivative gain live update
    });

    let _container = undefined;
    let _speedControlCheck = undefined;
    let _maxSpeedText = undefined;

    let _sendSpeedControl = false;
    let _useSpeedControlChanged = false;
    let _lastSendMs = 0;

    // range widgets
    const _KpRange = RangeWidgetController(
        _state, "Kp", "KpLive", 
        1.0, 0.0, 0.01, 2, 
        cssKpInput);
    const _KiRange = RangeWidgetController(
        _state, "Ki", "KiLive", 
        1.0, 0.0, 0.01, 2, 
        cssKiInput);
    const _KdRange = RangeWidgetController(
        _state, "Kd", "KdLive", 
        1.0, 0.0, 0.01, 2, 
        cssKdInput);
            
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
        _maxSpeedText = _container.querySelector(cssMaxSpeed);

        _KpRange.attachView();
        _KiRange.attachView();
        _KdRange.attachView();

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
            _maxSpeedText = undefined;

            _KpRange.detachView();
            _KiRange.detachView();
            _KdRange.detachView();
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
                _maxSpeedText.addEventListener("input", _onMaxSpeedChanged);

                _KpRange.startListening();
                _KiRange.startListening();
                _KdRange.startListening();
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
                _maxSpeedText.removeEventListener("input", _onMaxSpeedChanged);

                _KpRange.stopListening();
                _KiRange.stopListening();
                _KdRange.stopListening();
            }
            window.cancelAnimationFrame(_gameloop);
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
        _KpRange.updateViewState(force);
        _KiRange.updateViewState(force);
        _KdRange.updateViewState(force);
        _enforceView(force);
        return self;
    }

    /**
     * Validate text as a number in the given range.
     * 
     * @param {string} textValue 
     * @param {number} minValue 
     * @param {number} maxValue 
     * @return {number|undefined} // RET: if valid, the number
     *                            //      if invalid, undefined.
     */
    function validateNumericInput(
        textValue,              // IN : text to validate as a number
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
                                // RET: if valid, the number
                                //      if invalid, undefined
    {
        return ViewValidationTools.validateNumericInput(textValue, minValue, maxValue);
    }

    function _onSpeedControlChecked(event) {
        // update state to cause a redraw on game loop
        _state.setValue("useSpeedControl", event.target.checked);
    }

    function _onMaxSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const numericValue = validateNumericInput(event.target.value, 0.0);
        if((typeof numericValue == "number") && (numericValue > 0)) {
            // valid number within range
            _state.setValue("maxSpeed", numericValue);
            _state.setValue("maxSpeedValid", true);
        } else {
            _state.setValue("maxSpeedValid", false);    // show as invalid
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
        _useSpeedControlChanged = ViewStateTools.enforceCheck(_state, "useSpeedControl", _speedControlCheck, force) || _useSpeedControlChanged;
        _sendSpeedControl = _useSpeedControlChanged || _sendSpeedControl;
        _sendSpeedControl = ViewStateTools.enforceInput(_state, "maxSpeed", _maxSpeedText, force) || _sendSpeedControl;
        ViewStateTools.enforceValid(_state, "maxSpeedValid", _maxSpeedText, force); // make text input red if invalid
        
        _sendSpeedControl = _KpRange.enforceView(force) || _sendSpeedControl;
        _sendSpeedControl = _KiRange.enforceView(force) || _sendSpeedControl;
        _sendSpeedControl = _KdRange.enforceView(force) || _sendSpeedControl;
    }

    function _syncSpeedControl() {
        if(_sendSpeedControl) {
            if(roverCommand) {
                // rate limit to once per second
                const now = new Date();
                if(now.getTime() >= (_lastSendMs + 1000)) {
                    const useSpeedControl = _state.getValue("useSpeedControl");
                    if(typeof useSpeedControl == "boolean") {
                        if(useSpeedControl) {
                            // only send valid data
                            const maxSpeed = _state.getValue("maxSpeed");
                            const Kp = _state.getValue("Kp")
                            if((typeof maxSpeed == "number") && (maxSpeed > 0)) {
                                if((typeof Kp == "number") && (Kp > 0)) {
                                    roverCommand.syncSpeedControl(
                                        true,
                                        maxSpeed, 
                                        Kp,
                                        _state.getValue("Ki"),
                                        _state.getValue("Kd"));

                                    _useSpeedControlChanged = false;
                                    _sendSpeedControl = false;
                                    _lastSendMs = now.getTime();
                                }
                            }
                        } else if(_useSpeedControlChanged){
                            //
                            // if useSpeedControl is off, the only change we care
                            // about is if useSpeedControl itself changed
                            //
                            roverCommand.syncSpeedControl(false, 0, 0, 0, 0);
                            _useSpeedControlChanged = false;
                            _sendSpeedControl = false;
                            _lastSendMs = now.getTime();
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
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "updateView": updateView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView
    }
    return self;
}