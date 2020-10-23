
// import RollbackState from './rollback_state.js'
// import ViewStateTools from './view_state_tools.js'

//
// view controller for speed control tab panel
//
/**
 * View controller for speed control tab panel
 * 
 * @param {*} cssContainer 
 * @param {*} cssControlMode 
 * @param {*} cssMaxSpeed 
 * @param {*} cssKp 
 * @param {*} cssKi 
 * @param {*} cssKd 
 */
function SpeedViewController(cssContainer, cssControlMode, cssMaxSpeed, cssKpInput, cssKiInput, cssKdInput, cssKpText, cssKiText, cssKdText) {

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

    function isViewAttached() // RET: true if view is in attached state
    {
        return !!_container;
    }

    function attachView() {
        if (!isViewAttached()) {
            _container = document.querySelector(cssContainer);

            _speedControlCheck = _container.querySelector(cssControlMode);
            _maxSpeedText = _container.querySelector(cssMaxSpeed);
            _KpInput = _container.querySelector(cssKpInput);
            _KiInput = _container.querySelector(cssKiInput);
            _KdInput = _container.querySelector(cssKdInput);
            _KpText = _container.querySelector(cssKpText);
            _KiText = _container.querySelector(cssKiText);
            _KdText = _container.querySelector(cssKdText);
       }
        return self;
    }

    function detachView() {
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
        }
        return self;
    }

    let _listening = 0;
    function isListening() {
        return _listening > 0;
    }

    function startListening() {
        _listening += 1;
        if (1 === _listening) {
            if(isViewAttached()) {
                _speedControlCheck.addEventListener("change", _onSpeedControlChecked);
                _maxSpeedText.addEventListener("input", _onMaxSpeedChanged);
                _KpInput.addEventListener("input", _onKpChanged);
                _KiInput.addEventListener("input", _onKiChanged);
                _KdInput.addEventListener("input", _onKdChanged);
            }
        }

        if(_listening) {
            _updateLoop(performance.now());
        }

        return self;
    }

    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {

            if(isViewAttached()) {
                _speedControlCheck.removeEventListener("change", _onSpeedControlChecked);
                _maxSpeedText.removeEventListener("input", _onMaxSpeedChanged);
                _KpInput.removeEventListener("input", _onKpChanged);
                _KiInput.removeEventListener("input", _onKiChanged);
                _KdInput.removeEventListener("input", _onKdChanged);
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
        _state.setValue("Kp", parseFloat(event.target.value));
    }

    function _onKiChanged(event) {
        // update state to cause a redraw on game loop
        _state.setValue("Ki", parseFloat(event.target.value));
    }

    function _onKdChanged(event) {
        // update state to cause a redraw on game loop
        _state.setValue("Kd", parseFloat(event.target.value));
    }


    /**
     * Make the view match the state.
     * 
     * @param {boolean} force 
     */
    function _enforceView(force = false) {
        ViewStateTools.enforceCheck(_state, "useSpeedControl", _speedControlCheck, force);
        ViewStateTools.enforceInput(_state, "maxSpeed", _maxSpeedText, force);
        ViewStateTools.enforceValid(_state, "maxSpeedValid", _maxSpeedText, force);
        let changed = ViewStateTools.enforceInput(_state, "Kp", _KpInput, force);
        ViewStateTools.enforceText(_state, "Kp", _KpText, changed || force);
        changed = ViewStateTools.enforceInput(_state, "Ki", _KiInput, force);
        ViewStateTools.enforceText(_state, "Ki", _KiText, changed || force);
        changed = ViewStateTools.enforceInput(_state, "Kd", _KdInput, force);
        ViewStateTools.enforceText(_state, "Kd", _KdText, changed || force);
    }

    /**
     * called periodically to update the view.
     * 
     * @param {*} timeStamp 
     */
    function _updateLoop(timeStamp) {
        updateView();

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