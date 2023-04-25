/// <reference path="../utilities/dom_utilities.js" />
/// <reference path="telemetry_listener.js" />
/// <reference path="../command/rover_command.js" />

/**
 * View controller for the reset telemetry button.
 * 
 * @typedef {object} ResetTelemetryViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => ResetTelemetryViewControllerType} attachView
 * @property {() => ResetTelemetryViewControllerType} detachView
 * @property {() => boolean} isListening
 * @property {() => ResetTelemetryViewControllerType} startListening
 * @property {() => ResetTelemetryViewControllerType} stopListening
 * @property {() => boolean} isViewShowing
 * @property {() => ResetTelemetryViewControllerType} showView
 * @property {() => ResetTelemetryViewControllerType} hideView
 */

/**
 * View controller for the reset telemetry button.
 * 
 * @param {(() => void) | undefined} resetFunction      // IN : function to call when 
 *                                                              reset button is clicked
 * @param {TelemetryListenerType[]} telemetryListeners  // IN : list of listeners to reset.
 * @param {string} cssContainer                         // IN : selector for button container
 * @param {string} cssButton                            // IN : selector applied to container
 *                                                              to get the reset button.
 * @returns {ResetTelemetryViewControllerType}
 */
function ResetTelemetryViewController(
    resetFunction,
    telemetryListeners,
    cssContainer,
    cssButton)
{
    /** @type {HTMLElement} */
    let _container = undefined;

    /** @type {HTMLButtonElement} */
    let _button = undefined;

    /**
     * @summary Determine if controller is bound to DOM.
     * 
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    function isViewAttached()
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
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);
        if(!_container) throw Error(`${cssContainer} not found`);

        _button = _container.querySelector(cssButton);

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
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if (isViewAttached()) {
            _container = undefined;
            _button = undefined;
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
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            if(isViewAttached()) {
                _button.addEventListener("click", _onClick);
            }
        }

        return self;
    }

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
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {

            if(isViewAttached()) {
                _button.removeEventListener("click", _onClick);
            }
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
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
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
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * @summary Event hanlder for click on reset button.
     * 
     * @description
     * 
     * 
     * @param {Event} event 
     */
    function _onClick(event) {
        // send reset command to rover
        if(typeof resetFunction === "function") {
            resetFunction();
        }
        // reset telemetry
        if(Array.isArray(telemetryListeners)) {
            telemetryListeners.forEach(telemetryListener => {
                telemetryListener.reset();
            });
        };
    }

    /** @type {ResetTelemetryViewControllerType} */
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
    }

    return self;
}

