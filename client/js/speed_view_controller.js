
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
 * @param {string} cssMinSpeed 
 * @param {string} cssMaxSpeed 
 * @param {string} cssKpInput 
 * @param {string} cssKiInput 
 * @param {string} cssKdInput 
 */
function SpeedViewController(
    roverCommand, 
    cssContainer, cssControlMode, 
    cssMinSpeed, cssMaxSpeed, 
    cssKpInput, cssKiInput, cssKdInput) // IN : RangeWidgetController selectors
{

    const _state = RollbackState({
        useSpeedControl: false,     // true to have rover us speed control
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
        KpValid: false,             // true if proportial gain contains a valid value
                                    // false if not
        KiValid: false,             // true if integral gain contains a valid value
                                    // false if not
        KdValid: false,             // true if derivative gain contains a valid value
                                    // false if not
    });

    let _container = undefined;
    let _speedControlCheck = undefined;
    let _minSpeedText = undefined;
    let _maxSpeedText = undefined;
    let _KpGainText = undefined;
    let _KiGainText = undefined;
    let _KdGainText = undefined;

    let _sendSpeedControl = false;
    let _useSpeedControlChanged = false;
    let _lastSendMs = 0;
            
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
        _minSpeedText = _container.querySelector(cssMinSpeed);
        _maxSpeedText = _container.querySelector(cssMaxSpeed);
        _KpGainText = _container.querySelector(cssKpInput);
        _KiGainText = _container.querySelector(cssKiInput);
        _KdGainText = _container.querySelector(cssKdInput);

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
                _minSpeedText.addEventListener("input", _onMinSpeedChanged);
                _maxSpeedText.addEventListener("input", _onMaxSpeedChanged);
                _KpGainText.addEventListener("input", _onKpGainChanged);
                _KiGainText.addEventListener("input", _onKiGainChanged);
                _KdGainText.addEventListener("input", _onKdGainChanged);
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
                _minSpeedText.removeEventListener("input", _onMinSpeedChanged);
                _maxSpeedText.removeEventListener("input", _onMaxSpeedChanged);
                _KpGainText.removeEventListener("input", _onKpGainChanged);
                _KiGainText.removeEventListener("input", _onKiGainChanged);
                _KdGainText.removeEventListener("input", _onKdGainChanged);
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
        _enforceView(force);
        return self;
    }

    function _onSpeedControlChecked(event) {
        // update state to cause a redraw on game loop
        _state.setValue("useSpeedControl", event.target.checked);
    }

    function _onMinSpeedChanged(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "minSpeed", "minSpeedValid", event.target.value, 0.0)
    }

    function _onMaxSpeedChanged(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "maxSpeed", "maxSpeedValid", event.target.value, 0.0)
    }

    function _onKpGainChanged(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "Kp", "KpValid", event.target.value)
    }
    function _onKiGainChanged(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "Ki", "KiValid", event.target.value)
    }
    function _onKdGainChanged(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "Kd", "KdValid", event.target.value)
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
        _sendSpeedControl = ViewStateTools.enforceInput(_state, "minSpeed", _minSpeedText, force) || _sendSpeedControl;
        ViewStateTools.enforceValid(_state, "minSpeedValid", _minSpeedText, force); // make text input red if invalid
        
        _sendSpeedControl = ViewStateTools.enforceInput(_state, "Kp", _KpGainText, force) || _sendSpeedControl;
        ViewStateTools.enforceValid(_state, "KpValid", _KpGainText, force); // make text input red if invalid
        _sendSpeedControl = ViewStateTools.enforceInput(_state, "Ki", _KiGainText, force) || _sendSpeedControl;
        ViewStateTools.enforceValid(_state, "KiValid", _KiGainText, force); // make text input red if invalid
        _sendSpeedControl = ViewStateTools.enforceInput(_state, "Kd", _KdGainText, force) || _sendSpeedControl;
        ViewStateTools.enforceValid(_state, "KdValid", _KdGainText, force); // make text input red if invalid
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
                            const minSpeed = _state.getValue("minSpeed");
                            const maxSpeed = _state.getValue("maxSpeed");
                            const Kp = _state.getValue("Kp")
                            if((typeof minSpeed == "number") && 
                               (minSpeed >= 0) && 
                               (typeof maxSpeed == "number") && 
                               (maxSpeed > minSpeed)) 
                            {
                                if((typeof Kp == "number") && (Kp > 0)) {
                                    roverCommand.syncSpeedControl(
                                        true,
                                        minSpeed, 
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