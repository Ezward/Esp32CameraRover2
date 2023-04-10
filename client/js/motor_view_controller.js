/// <reference path="utilities.js" />
/// <reference path="rollback_state.js" />
/// <reference path="view_state_tools.js" />
/// <reference path="rover_command.js" />
/// <reference path="range_widget_controller.js" />

/**
 * @typedef {object} MotorViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => MotorViewControllerType} attachView
 * @property {() => MotorViewControllerType} detachView
 * @property {() => boolean} isListening
 * @property {() => MotorViewControllerType} startListening
 * @property {() => MotorViewControllerType} stopListening
 * @property {() => boolean} isViewShowing
 * @property {() => MotorViewControllerType} showView
 * @property {() => MotorViewControllerType} hideView
 * @property {(force?: boolean) => MotorViewControllerType} updateView
 */

/**
 * @summary Construct a controller for the motor values view.
 * @description The controller manages the view for editing
 *              motor stall values and sends any changes
 *              to the rover.
 * 
 * @param {RoverCommandType} roverCommand 
 * @param {string} cssContainer 
 * @param {string} cssMotorOneStall 
 * @param {string} cssMotorTwoStall 
 * @returns {MotorViewControllerType}
 */
function MotorViewController(
    roverCommand, 
    cssContainer, 
    cssMotorOneStall,
    cssMotorTwoStall)
{
    let _syncValues = false;   // true to send the stall values to the rover
    let _lastSyncMs = 0;       // millis of last time we synced values

    //
    // view state
    //
    const _state = RollbackState({
        motorOneStall: 0,     // float: fraction of full throttle below which engine stalls
        motorTwoStall: 0,     // float: fraction of full throttle below which engine stalls
        motorOneStallLive: 0, // float: live update of motorOneStall
        motorTwoStallLive: 0, // float: live update of motorTwoStall
    });

    /**
     * View's dom attachment
     * @type {HTMLElement | undefined}
     */
    let container = undefined;

    const _motorOneStallRange = RangeWidgetController(
        _state, "motorOneStall", "motorOneStallLive", 
        1.0, 0.0, 0.01, 2, 
        cssMotorOneStall);

    const _motorTwoStallRange = RangeWidgetController(
        _state, "motorTwoStall", "motorTwoStallLive", 
        1.0, 0.0, 0.01, 2, 
        cssMotorTwoStall);

    /**
     * Determine if controller is attached to DOM.
     * 
     * @returns {boolean}
     */
    function isViewAttached() {
        return !!container;
    }

    /**
     * @summary Bind the controller to the DOM.
     * @description Lookup the dom elements specified by the css selectors
     *              passed to the constructor.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function attachView() {
        if (!isViewAttached()) {
            container = document.querySelector(cssContainer);

            _motorOneStallRange.attachView();
            _motorTwoStallRange.attachView();
        }
        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * @description release references to the DOM.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function detachView() {
        if (isListening()) throw new Error("Attempt to detachView while still listening");
        if (isViewAttached()) {
            container = undefined;

            _motorOneStallRange.detachView();
            _motorTwoStallRange.detachView();
        }
        return self;
    }

    //
    // bind view listeners
    //
    let _listening = 0;

    /**
     * @summary Determine if listening for messages and DOM events.
     * 
     * @returns {boolean}
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for messages and DOM events.
     * @description Enable message processing and DOM event listeners.
     *              NOTE: Each call to startListening() must be balanced
     *              with a call to stopListening() for listeners to be 
     *              deactivated.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function startListening() {
        _listening += 1;
        if (1 === _listening) {
            _motorOneStallRange.startListening();
            _motorTwoStallRange.startListening();
        }

        // start updating
        if(_listening) {
            _gameloop(performance.now());
        }
        return self;
    }

    /**
     * @summary Stop listening for messages and DOM events.
     * @description Disable message processing and DOM event listeners.
     *              NOTE: Each call to startListening() must be balanced
     *              with a call to stopListening() for listeners to be 
     *              deactivated.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            _motorOneStallRange.stopListening();
            _motorTwoStallRange.stopListening();

            // stop updating
            window.cancelAnimationFrame(_animationFrameNumber);
        }
        return self;
    }

    //
    // view visibility
    //
    let showing = 0;

    /**
     * @summary Determine if view is showing/enabled.
     * 
     * @returns {boolean}
     */
    function isViewShowing() {
        return showing > 0;
    }

    /**
     * @summary Show the controller's DOM elements.
     * @description showView() increments a count and hideView() decrements it.
     *              When the count is positive then the view is showing/enabled.
     *              When the count goes to zero the view is hidden/disabled.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function showView() {
        showing += 1;
        if (1 === showing) {
            show(container);
        }
        return self;
    }

    /**
     * @summary Hide the controller's DOM elements.
     * @description showView() increments a count and hideView() decrements it.
     *              When the count is positive then the view is showing/enabled.
     *              When the count goes to zero the view is hidden/disabled.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function hideView() {
        showing -= 1;
        if (0 === showing) {
            hide(container);
        }
        return self;
    }

    /**
     * @summary Update the view state and render the view if changed.
     * @description The view backing state is updated and if there are 
     *              changes or force is true, then the redraw the
     *              affected view elements.
     * 
     * @param {boolean} force // RET: 
     * @returns 
     */
    function updateView(force = false) {
        _motorOneStallRange.updateViewState(force);
        _motorTwoStallRange.updateViewState(force);
        _enforceView(force);
        return self;
    }

    /**
     * @summary Make the view reflect the view state.
     * @description If the view state has changed OR 
     *              force = true then update
     *              the associated view elements so they
     *              are redrawn so they match the state.
     * 
     * @param {boolean} force 
     */
    function _enforceView(force = false) {
        _syncValues = _motorOneStallRange.enforceView(force) || _syncValues;
        _syncValues = _motorTwoStallRange.enforceView(force) || _syncValues;
    }

    /**
     * @summary Determine if the motor stall value is valid.
     * 
     * @param {number} value // IN: motor stall value to validate
     * @returns {boolean}    // RET: true if valid, false if not
     */
    function _isMotorStallValid(value) {
        return (typeof value == "number") && (value >= 0) && (value <= 1);
    }

    /**
     * @summary Send any motor stall value change to rover.
     * @description If _syncValues flag indicates that the motor stall value
     *              has changed, then send the new values to the rover.
     *              This is rate limited to so we don't overload the rover
     *              communication.
     */
    function _syncMotorStall() {
        if(_syncValues) {
            if(roverCommand) {
                // rate limit to once per second
                const now = new Date();
                if(now.getTime() >= (_lastSyncMs + 1000)) {
                    const motorOneStall = _state.getValue("motorOneStall");
                    const motorTwoStall = _state.getValue("motorTwoStall");
                    if(_isMotorStallValid(motorOneStall) && _isMotorStallValid(motorTwoStall)) {
                        roverCommand.syncMotorStall(motorOneStall, motorTwoStall);

                        _syncValues = false;
                        _lastSyncMs = now.getTime();
                    }
                }
            }
        }
    }

    let _animationFrameNumber = 0;

    /**
     * @summary Periodically update view and sync values to rover.
     * @description This function is called periodically to
     *              keep the view updated and to synchronize (send)
     *              updated motor control values to the rover.
     * 
     * @param {number} timeStamp 
     */
    function _gameloop(timeStamp) {
        updateView();
        _syncMotorStall();

        if (_listening) {
            _animationFrameNumber = window.requestAnimationFrame(_gameloop);
        }
    }

    /** @type {MotorViewControllerType} */
    const self = {
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
        "updateView": updateView,
    }

    return self;
}