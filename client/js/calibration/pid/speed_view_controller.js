/// <reference path="../../config/config.js" />
/// <reference path="../../utilities/utilities.js" />
/// <reference path="../../utilities/dom_utilities.js" />
/// <reference path="../../view/view_validation_tools.js" />
/// <reference path="../../view/view_state_tools.js" />
/// <reference path="../../utilities/rollback_state.js" />
/// <reference path="../../command/rover_command.js" />
/// <reference path="speed_control_model.js" />


/**
 * @typedef {object} SpeedViewControllerType
 * @property {() => boolean} isModelBound
 * @property {(speedControlModel: SpeedControlModelType) => SpeedViewControllerType} bindModel
 * @property {() => SpeedViewControllerType} unbindModel
 * @property {() => boolean} isViewAttached
 * @property {() => SpeedViewControllerType} attachView
 * @property {() => SpeedViewControllerType} detachView
 * @property {() => boolean} isListening
 * @property {() => SpeedViewControllerType} startListening
 * @property {() => SpeedViewControllerType} stopListening
 * @property {() => boolean} isViewShowing
 * @property {() => SpeedViewControllerType} showView
 * @property {() => SpeedViewControllerType} hideView
 * @property {(force?: boolean) => SpeedViewControllerType} updateView
 */

/**
 * View controller for speed control tab panel
 * 
 * @param {RoverCommanderType} roverCommand 
 * @param {string} cssContainer    // IN s
 * @param {string} cssControlMode  // IN : initial control mode to activate
 * @param {string[]} cssMinSpeed   // IN : min-speed input selector for each wheel
 * @param {string[]} cssMaxSpeed   // IN : max speed input selector for each wheel
 * @param {string[]} cssKpInput    // IN : Kp proportional gain input selector for each wheel
 * @param {string[]} cssKiInput    // IN : Ki integral gain input selector for each wheel
 * @param {string[]} cssKdInput    // IN : Kd derivative gain input selector for each wheel
 * @returns {SpeedViewControllerType}
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

    /** @type {HTMLElement | undefined} */
    let _container = undefined;

    /** @type {HTMLInputElement | undefined} */
    let _speedControlCheck = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _minSpeedText = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _maxSpeedText = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _KpGainText = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _KiGainText = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _KdGainText = undefined;

    /** @type {SpeedControlModelType | undefined} */
    let _model = undefined;

    let _sendSpeedControl = false;
    let _useSpeedControlChanged = false;
    let _lastSendMs = 0;


    /**
     * @summary Determine if there is a model bound for updating.
     * 
     * @returns {boolean} // RET: true if model is bound, false if not
     */
    function isModelBound() {
        return !!_model;
    }

    /**
     * @summary Bind the model, so we can update it
     * when the view is committed.
     * 
     * @param {SpeedControlModelType} speedControlModel // IN : SpeedControlModel to bind
     * @returns {SpeedViewControllerType}               // RET: this SpeedViewController
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
     * @summary unbind the model
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function unbindModel() {
        _model = undefined;
        return self;
    }
            
    /**
     * @summary Determine if controller is bound to DOM.
     * 
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    function isViewAttached() // RET: true if view is in attached state
    {
        return !!_container;
    }

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
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

    /**
     * @summary Unbind the controller from the DOM.
     * 
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
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

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for DOM events.
     * @description
     * This adds event listeners to attached dom elements.
     * 
     * >> NOTE: the view must be attached.
     * 
     * >> NOTE: This keeps count of calls to start/stop and balances multiple calls;
     * 
     * @example
     * ```
     * startListening() // true === isListening()
     * startListening() // true === isListening()
     * stopListening()  // true === isListening()
     * stopListening()  // false === isListening()
     * ```
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
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

    let _requestAnimationFrameNumber = 0;

    /**
     * @summary Stop listening for DOM events.
     * @description
     * This removes event listeners from attached dom elements.
     * 
     * >> NOTE: the view must be attached.
     * 
     * >> NOTE: This keeps count of calls to start/stop and balances multiple calls;
     * 
     * @example
     * ```
     * startListening() // true === isListening()
     * startListening() // true === isListening()
     * stopListening()  // true === isListening()
     * stopListening()  // false === isListening()
     * ```
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
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
            window.cancelAnimationFrame(_requestAnimationFrameNumber);
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    /**
     * @summary Determine if the view is showing.
     * 
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    function isViewShowing() {
        return _showing > 0;
    }

    /**
     * @summary Show/Enable the view.
     * 
     * @description
     * Show the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function showView() {
        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    /**
     * @summary Hide/Disable the view.
     * 
     * @description
     * Hide the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * @summary Update view state and render if changed.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function updateView(force = false) {
        // make sure live state matches state of record
        _enforceView(force);
        return self;
    }

    /**
     * @private
     * @summary Event handler called when speed control checkbox changes.
     * @param {Event & {target: {checked: boolean}}} event 
     */
    function _onSpeedControlChecked(event) {
        // update state to cause a redraw on game loop
        _state.forEach(s => s.setValue("useSpeedControl", event.target.checked));
    }

    /**
     * @private
     * @summary Select the correct _state[x] given selectors and an id.
     * 
     * @param {string[]} selectors            // IN : list of selectors to check
     * @param {string} id                     // IN : element id
     * @returns {RollbackStateType|undefined} // RET: rollback state if a selector matches id
     *                                        //      or undefined if no selector matches id
     */
    function _selectState(selectors, id) {
        for(let i = 0; i < selectors.length; i += 1) {
            if(selectors[i] === ("#" + id)) {
                return _state[i];
            }
        }
        return undefined;
    }

    /**
     * @private
     * @summary Event handler called when min speed input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onMinSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssMinSpeed, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "minSpeed", "minSpeedValid", event.target.value, 0.0);
        }
    }

    /**
     * @private
     * @summary Event handler called when max speed input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onMaxSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssMaxSpeed, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "maxSpeed", "maxSpeedValid", event.target.value, 0.0);
        }
    }

    /**
     * @private
     * @summary Event handler called when Kp gain input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onKpGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKpInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Kp", "KpValid", event.target.value);
        }
    }

    /**
     * @private
     * @summary Event handler called when Ki gain input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onKiGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKiInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Ki", "KiValid", event.target.value);
        }
    }

    /**
     * @private
     * @summary Event handler called when Kd gain input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onKdGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKdInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Kd", "KdValid", event.target.value);
        }
    }

    /**
     * @private
     * @summary Make the view match the state.
     * @description
     * If the view state has changes (or force == true)
     * then make the view match the view state.
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
     * @private
     * @summary Write changes to speed control parameters to the rover.
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
                                        _model.setUseSpeedControl(useSpeedControl);
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
                            roverCommand.syncSpeedControl(Wheels.id("left") + Wheels.id("right"), false, 0, 0, 0, 0, 0);
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
            _requestAnimationFrameNumber = window.requestAnimationFrame(_updateLoop);
        }
    }

    /** @type {SpeedViewControllerType} */
    const self = Object.freeze({
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
    });

    return self;
}