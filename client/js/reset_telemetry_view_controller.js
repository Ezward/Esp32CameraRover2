


// import ViewStateTools from './view_state_tools.js'
// import ViewWidgetTools from './view_widget_tools.js'


function ResetTelemetryViewController(
    roverCommand,
    telemetryListeners,
    cssContainer,
    cssButton)
{
    let _container = undefined;
    let _button = undefined;

    /**
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    function isViewAttached()
    {
        return !!_container;
    }

    /**
     * Bind the controller to the associated DOM elements.
     * NOTE: attaching more than once is ignored.
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
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
     * Unbind the controller from the DOM.
     * NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
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
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * Start listening for events.
     * NOTE: the controller must be attached.
     * NOTE: keeps count of calls to start/stop, 
     *       and balances multiple calls;
     *       - startListening() // true == isListening()
     *       - startListening() // true == isListening()
     *       - stopListening()  // true == isListening()
     *       - stopListening()  // false == isListening()
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
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
     * Stop listening for events.
     * NOTE: the controller must be attached.
     * NOTE: keeps count of calls to start/stop, 
     *       and balances multiple calls;
     *       - startListening() // true == isListening()
     *       - startListening() // true == isListening()
     *       - stopListening()  // true == isListening()
     *       - stopListening()  // false == isListening()
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
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
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    function isViewShowing() {
        return _showing > 0;
    }

    /**
     * Show the view.
     * NOTE: the controller must be attached.
     * NOTE: keeps count of calls to start/stop, 
     *       and balances multiple calls;
     *       - showView()  // true == isViewShowing()
     *       - showView()  // true == isViewShowing()
     *       - hideView()  // true == isViewShowing()
     *       - hideView()  // false == isViewShowing()
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
     */
    function showView() {
        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    /**
     * Hide the view.
     * NOTE: the controller must be attached.
     * NOTE: keeps count of calls to start/stop, 
     *       and balances multiple calls;
     *       - showView()  // true == isViewShowing()
     *       - showView()  // true == isViewShowing()
     *       - hideView()  // true == isViewShowing()
     *       - hideView()  // false == isViewShowing()
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
     */
    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    function _onClick(event) {
        // send reset command to rover
        if(typeof roverCommand === "function") {
            roverCommand();
        }
        // reset telemetry
        if(Array.isArray(telemetryListeners)) {
            telemetryListeners.forEach(telemetryListener => {
                telemetryListener.reset();
            });
        };
    }

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

