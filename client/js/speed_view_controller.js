
// import RollbackState from './rollback_state.js'
// import ViewStateTools from './view_state_tools.js'

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
 * @param {string} cssKpText 
 * @param {string} cssKiText 
 * @param {string} cssKdText 
 * @param {string} cssKpDec 
 * @param {string} cssKiDec 
 * @param {string} cssKdDec 
 * @param {string} cssKpInc 
 * @param {string} cssKiInc 
 * @param {string} cssKdInc 
 */
function SpeedViewController(
    roverCommand, 
    cssContainer, cssControlMode, cssMaxSpeed, 
    cssKpInput, cssKiInput, cssKdInput, // IN : range input selectors
    cssKpText, cssKiText, cssKdText,    // IN : range text value selectors
    cssKpDec, cssKiDec, cssKdDec,       // IN : range decrement selectors
    cssKpInc, cssKiInc, cssKdInc)       // IN : range increment selectors
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
    let _KpInput = undefined;
    let _KiInput = undefined;
    let _KdInput = undefined;
    let _KpText = undefined;
    let _KiText = undefined;
    let _KdText = undefined;
    let _KpInc = undefined;
    let _KpDec = undefined;
    let _KiInc = undefined;
    let _KiDec = undefined;
    let _KdInc = undefined;
    let _KdDec = undefined;

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
        _maxSpeedText = _container.querySelector(cssMaxSpeed);
        _KpInput = _container.querySelector(cssKpInput);
        _KiInput = _container.querySelector(cssKiInput);
        _KdInput = _container.querySelector(cssKdInput);
        _KpText = _container.querySelector(cssKpText);
        _KiText = _container.querySelector(cssKiText);
        _KdText = _container.querySelector(cssKdText);

        _KpInc = _container.querySelector(cssKpInc);
        _KpDec = _container.querySelector(cssKpDec);
        _KiInc = _container.querySelector(cssKiInc);
        _KiDec = _container.querySelector(cssKiDec);
        _KdInc = _container.querySelector(cssKdInc);
        _KdDec = _container.querySelector(cssKdDec);
       
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
            _KpInput = undefined;
            _KiInput = undefined;
            _KdInput = undefined;
            _KpText = undefined;
            _KiText = undefined;
            _KdText = undefined;

            _KpInc = undefined;
            _KpDec = undefined;
            _KiInc = undefined;
            _KiDec = undefined;
            _KdInc = undefined;
            _KdDec = undefined;
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
                _KpInput.addEventListener("change", _onKpChanged);
                _KiInput.addEventListener("change", _onKiChanged);
                _KdInput.addEventListener("change", _onKdChanged);
                _KpInput.addEventListener("input", _onKpLiveUpdate);
                _KiInput.addEventListener("input", _onKiLiveUpdate);
                _KdInput.addEventListener("input", _onKdLiveUpdate);

                _KpInc.addEventListener("click", _onKpIncrement);
                _KpDec.addEventListener("click", _onKpDecrement);
                _KiInc.addEventListener("click", _onKiIncrement);
                _KiDec.addEventListener("click", _onKiDecrement);
                _KdInc.addEventListener("click", _onKdIncrement);
                _KdDec.addEventListener("click", _onKdDecrement);
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
                _KpInput.removeEventListener("change", _onKpChanged);
                _KiInput.removeEventListener("change", _onKiChanged);
                _KdInput.removeEventListener("change", _onKdChanged);
                _KpInput.removeEventListener("input", _onKpLiveUpdate);
                _KiInput.removeEventListener("input", _onKiLiveUpdate);
                _KdInput.removeEventListener("input", _onKdLiveUpdate);

                _KpInc.removeEventListener("click", _onKpIncrement);
                _KpDec.removeEventListener("click", _onKpDecrement);
                _KiInc.removeEventListener("click", _onKiIncrement);
                _KiDec.removeEventListener("click", _onKiDecrement);
                _KdInc.removeEventListener("click", _onKdIncrement);
                _KdDec.removeEventListener("click", _onKdDecrement);
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
        if(force || _state.isStaged("Kp")) {
            _state.setValue("KpLive", _state.getValue("Kp"));
        }
        if(force || _state.isStaged("Ki")) {
            _state.setValue("KiLive", _state.getValue("Ki"));
        }
        if(force || _state.isStaged("Kd")) {
            _state.setValue("KdLive", _state.getValue("Kd"));
        }
        _enforceView(force);
        return self;
    }

    /**
     * Validate text as a number in the given range.
     * 
     * @param {string} textValue 
     * @param {number} minValue 
     * @param {number} maxValue 
     */
    function validateNumericInput(
        textValue,              // IN : text to validate as a number
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
                                // RET: if valid, the number
                                //      if invalid, undefined
    {
        if(!textValue) return undefined;

        const numericValue = parseFloat(textValue);
        if (isNaN(numericValue)) return undefined;
        if ((typeof minValue == "number") && (numericValue < minValue)) return undefined;
        if ((typeof maxValue == "number") && (numericValue > maxValue)) return undefined;
        return numericValue;
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

    function _onKpChanged(event) {
        // update state to cause a redraw on game loop
        const value = parseFloat(event.target.value)
        _state.setValue("Kp", value);
        _state.setValue("KpLive", value);
    }

    function _onKpLiveUpdate(event) {
        // update state to cause a redraw on game loop
        _state.setValue("KpLive", parseFloat(event.target.value));
    }

    function _onKiChanged(event) {
        // update state to cause a redraw on game loop
        const value = parseFloat(event.target.value)
        _state.setValue("Ki", value);
        _state.setValue("KiLive", value);
    }

    function _onKiLiveUpdate(event) {
        // update state to cause a redraw on game loop
        _state.setValue("KiLive", parseFloat(event.target.value));
    }

    function _onKdChanged(event) {
        // update state to cause a redraw on game loop
        const value = parseFloat(event.target.value)
        _state.setValue("Kd", value);
        _state.setValue("KdLive", value);
    }

    function _onKdLiveUpdate(event) {
        // update state to cause a redraw on game loop
        _state.setValue("KdLive", parseFloat(event.target.value));
    }

    /**
     * Increment a range input element's state.
     * 
     * @param {RollbackState} state     // state bound to range control
     * @param {string} parameter        // name of state parameter
     * @param {string} parameterLive    // name of live update state parameter
     * @param {number} increment        // range's increment value
     * @param {number} maxRange         // range's maximum allowed value
     * @param {number} decimals         // number of decimals to show in value
     */
    function _onRangeIncrement(state, parameter, parameterLive, increment, maxRange, decimals) {
        // update state to cause a redraw on game loop
        let value = state.getValue(parameter);
        if((typeof value == "number") && (value <= (maxRange - increment)))
        {
            value = constrain(parseFloat((value + increment).toFixed(decimals)), 0, 1);
            state.setValue(parameter, value);
            state.setValue(parameterLive, value);
        }
    }

    /**
     * Decrement a range input element's state.
     * 
     * @param {RollbackState} state     // state bound to range control
     * @param {string} parameter        // name of state parameter
     * @param {string} parameterLive    // name of live update state parameter
     * @param {number} increment        // range's increment value
     * @param {number} minRange         // range's minimum allowed value
     * @param {number} decimals         // number of decimals to show in value
     */
    function _onRangeDecrement(state, parameter, parameterLive, increment, minRange, decimals) {
        // update state to cause a redraw on game loop
        let value = state.getValue(parameter);
        if((typeof value == "number") && (value >= (minRange + increment)))
        {
            value = constrain(parseFloat((value - increment).toFixed(decimals)), 0, 1);
            state.setValue(parameter, value);
            state.setValue(parameterLive, value);
        }
    }

    function _onKdIncrement(event) {
        // update state to cause a redraw on game loop
        _onRangeIncrement(_state, "Kd", "KdLive", 0.01, 1, 2);
    }
    function _onKdDecrement(event) {
        // update state to cause a redraw on game loop
        _onRangeDecrement(_state, "Kd", "KdLive", 0.01, 0, 2);
    }

    function _onKiIncrement(event) {
        // update state to cause a redraw on game loop
        _onRangeIncrement(_state, "Ki", "KiLive", 0.01, 1, 2);
    }
    function _onKiDecrement(event) {
        // update state to cause a redraw on game loop
        _onRangeDecrement(_state, "Ki", "KiLive", 0.01, 0, 2);
    }

    function _onKpIncrement(event) {
        // update state to cause a redraw on game loop
        _onRangeIncrement(_state, "Kp", "KpLive", 0.01, 1, 2);
    }
    function _onKpDecrement(event) {
        // update state to cause a redraw on game loop
        _onRangeDecrement(_state, "Kp", "KpLive", 0.01, 0, 2);
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
        _sendSpeedControl = ViewStateTools.enforceInput(_state, "Kp", _KpInput, force) || _sendSpeedControl;
        ViewStateTools.enforceText(_state, "KpLive", _KpText, force);
        _sendSpeedControl = ViewStateTools.enforceInput(_state, "Ki", _KiInput, force) || _sendSpeedControl;
        ViewStateTools.enforceText(_state, "KiLive", _KiText, force);
        _sendSpeedControl = ViewStateTools.enforceInput(_state, "Kd", _KdInput, force) || _sendSpeedControl;
        ViewStateTools.enforceText(_state, "KdLive", _KdText, force);
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