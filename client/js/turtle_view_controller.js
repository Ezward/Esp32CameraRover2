/// <reference path="utilities.js" />
/// <reference path="dom_utilities.js" />
/// <reference path="message_bus.js" />
/// <reference path="rollback_state.js" />
/// <reference path="rover_command.js" />
/// <reference path="range_widget_controller.js" />
/// <reference path="turtle_keyboard_controller.js" />


///////////////// Rover Command View Controller ////////////////////

/**
 * @summary A view controller for turtle movement control.
 * 
 * @typedef {object} TurtleViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => TurtleViewControllerType} attachView
 * @property {() => TurtleViewControllerType} detachView
 * @property {(force?: boolean) => TurtleViewControllerType} updateView
 * @property {() => boolean} isListening
 * @property {() => TurtleViewControllerType} startListening
 * @property {() => TurtleViewControllerType} stopListening
 * @property {() => TurtleViewControllerType} resetRoverButtons
 * @property {(buttonId: string) => TurtleViewControllerType} stopRoverButton
 * @property {(message: string, data: any, specifier?: string | undefined) => void} onMessage
 */

/**
 * @summary Construct view controller for turtle movement control.
 * 
 * @description
 * This controller provides buttons to move the rover
 * in turtle mode.
 * 
 * @param {RoverCommanderType} roverCommand 
 * @param {MessageBusType} messageBus 
 * @param {string} cssContainer 
 * @param {string} cssRoverButton 
 * @param {string} cssRoverSpeedInput 
 * @returns {TurtleViewControllerType}
 */
function TurtleViewController(
    roverCommand, 
    messageBus, 
    cssContainer, cssRoverButton, cssRoverSpeedInput) 
{
    const _state = RollbackState({
        "speedPercent": 0.9,     // float: 0..1 normalized speed
        "speedPercentLive": 0.9, // float: 0..1 normalized speed live update
        "activeButton": "",      // string: id of active turtle button or empty string if none are active
    });

    /** @type {Element | undefined} */
    let _container = undefined;

    /** @type {string[] | undefined} */
    let _turtleButtonNames = undefined;

    /** @type {HTMLButtonElement[] | undefined} */
    let _turtleButtons = undefined;

    const _speedInput = RangeWidgetController(
        _state, "speedPercent", "speedPercentLive", 
        1.0, 0.0, 0.01, 2, 
        cssRoverSpeedInput)

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function attachView() {
        if(isViewAttached()) throw new Error("Attempt to rebind the view.");

        _container = document.querySelector(cssContainer);
        _turtleButtons = Array.from(_container.querySelectorAll(cssRoverButton));
        _turtleButtonNames = _turtleButtons.map(b => b.id.charAt(0).toUpperCase() + b.id.slice(1));
        _speedInput.attachView();
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
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if(isViewAttached()) {
            _container = undefined;
            _turtleButtons = undefined;
            _turtleButtonNames = undefined;
            _speedInput.detachView();
        }
        return self;
    }

    /**
     * @summary Determine if dom elements have been attached.
     * @returns {boolean}
     */
    function isViewAttached() {
        return !!_turtleButtons;
    }

    //////////// update the view //////////////

    /**
     * Update the view based on the state.
     * Generally, this is called with force=false
     * and updates only happen if state has changed.
     * 
     * @param {boolean} force true to force update of controls
     *                        false to update controls based on staged state
     */
    function updateView(force = false) {
        if (isViewAttached()) {
            _enforceActiveButton(force);
            _speedInput.enforceView(force);
        }
        return self;
    }

    /**
     * @private
     * @summary Update the view state once per frame
     * 
     * @param {number} timestamp 
     */
    function _updateLoop(timestamp) {
        updateView();

        if(isListening()) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_updateLoop);
        }
    }

    /**
     * @summary Reset rover buttons to default state.
     * 
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function resetRoverButtons() {
        if(isViewAttached()) {
            for(let i = 0; i < _turtleButtons.length; i += 1) {
                // reset button text based on button id
                const butt = _turtleButtons[i];
                butt.innerHTML = _turtleButtonNames[i];
                butt.classList.remove("disabled");
                butt.disabled = false;
            }
        }
        return self;
    }

    /**
     * @summary set a button to 'stop' state
     * 
     * @description
     * set the given button to 'stop' state
     * and disable other buttons
     * 
     * @param {string} buttonId 
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function stopRoverButton(buttonId) {
        if(isViewAttached()) {
            for(let i = 0; i < _turtleButtons.length; i += 1) {
                // reset button text based on button id
                const butt = _turtleButtons[i];
                if (buttonId === butt.id) {
                    butt.innerHTML = "Stop";
                    butt.classList.remove("disabled");
                    butt.disabled = false;
                } else {
                    butt.innerHTML = _turtleButtonNames[i];
                    butt.classList.add("disabled");
                    butt.disabled = true;
                }
            }
        }
        return self;
    }

    /**
     * @private
     * @summary Enforce the state of the button controls.
     * 
     * @param {boolean} force true to force update of controls
     *                        false to update controls based on staged state
     */
    function _enforceActiveButton(force = false) {
        if(force || _state.isStaged("activeButton")) {
            const buttonId = _state.commitValue("activeButton");
            if(!buttonId) {
                resetRoverButtons();
            } else {
                stopRoverButton(buttonId);
            }
        }
    }

    /////////////// listen for input ///////////////////
    let _listening = 0;
    let _requestAnimationFrameNumber = 0

    /**
     * @summary Start listening for messages and DOM events.
     * @description
     * This adds event listeners to attached dom elements
     * and subscribes to turtle button messages.
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
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function startListening() {
        if(!isViewAttached()) throw new Error("Attempt to start listening before view is bound.");

        _listening += 1;
        if (1 === _listening) {
            if(_turtleButtonNames) {
                _turtleButtons.forEach(el => {
                    //
                    // toggle between the button command and the stop command
                    //
                    el.addEventListener("click", _onButtonClick);
                });
            }

            _speedInput.startListening();

            if(messageBus) {
                messageBus.subscribe(TURTLE_KEY_DOWN, self);
                messageBus.subscribe(TURTLE_KEY_UP, self);
            }
        }

        _requestAnimationFrameNumber = window.requestAnimationFrame(_updateLoop);
        return self;
    }

    /**
     * @summary Stop listening for DOM events.
     * 
     * @description
     * This removes event listeners from attached dom elements
     * and unsubscribes from turtle button messages.
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
     * @returns {TurtleViewControllerType} this controller instance for fluent chain calling
     */
    function stopListening() {
        if(!isViewAttached()) throw new Error("Attempt to stop listening to unbound view.");

        _listening -= 1;
        if (0 === _listening) {
            if(_turtleButtons) {
                _turtleButtons.forEach(el => {
                    //
                    // toggle between the button command and the stop command
                    //
                    el.removeEventListener("click", _onButtonClick);
                });
            }

            _speedInput.stopListening();

            if(messageBus) {
                messageBus.unsubscribeAll(self);
            }

            window.cancelAnimationFrame(_requestAnimationFrameNumber);
        }
        return self;
    }

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
     * @summary Handle TURTLE_KEY_UP/DOWN messages
     * 
     * @description
     * Handle TURTLE_KEY_UP/DOWN messages by
     * selecting the button indicated in
     * the message data.
     * 
     * @param {string} message 
     * @param {any} data 
     * @param {string | undefined} specifier 
     */
    function onMessage(message, data, specifier = undefined) {
        switch (message) {
            case TURTLE_KEY_DOWN: {
                _onButtonSelected(data);
                return;
            }
            case TURTLE_KEY_UP: {
                _onButtonUnselected(data);
                return;
            }
            default: {
                console.log("Unhandled message in TurtleViewController");
            }
        }
    }


    /**
     * @private
     * @summary handle turtle button click
     * 
     * @description
     * Handle button click click by 
     * toggling the selected state of the button.
     * When the button becomes 'active' (so it looks
     * pushed) then a corresponding turtle control
     * message is sent to the rover.
     * When the button becomes 'inactive' then
     * a 'stop' message is sent to the rover.
     * 
     * @param {Event & {target: {id: string}}} event 
     */
    function _onButtonClick(event) {
        if (roverCommand.isTurtleCommandName(event.target.id)) {
            const buttonId = /** @type {TurtleCommandName} */(event.target.id);
            if (buttonId === _state.getValue("activeButton")) {
                _onButtonUnselected(buttonId);
            } else {
                _onButtonSelected(buttonId);
            }
        }
    }

    /**
     * @private
     * @summary Select a turtle control button
     * 
     * @description
     * Select the given turtle control button 
     * to make it 'active'  (so it looks
     * pushed) and send a corresponding turtle control
     * message to the rover.
     * 
     * @param {TurtleCommandName} buttonId 
     */
    function _onButtonSelected(buttonId) {
        //
        // if it is the active button,  
        // then revert the button and send 'stop' command
        // if it is not the active button, 
        // then make it active and send it's command
        //
        _state.setValue("activeButton", buttonId);
        roverCommand.enqueueTurtleCommand(buttonId, int(100 * _state.getValue("speedPercent"))); // run button command
    }

    /**
     * @private
     * @summary Deselect a turtle control button
     * 
     * @description
     * Deselect the given turtle control button 
     * to make it 'inactive'  (so it looks
     * un-pushed) and send a 'stop' turtle control
     * message to the rover.
     * 
     * @param {TurtleCommandName} buttonId 
     */
    function _onButtonUnselected(buttonId) {
        _state.setValue("activeButton", "");
        roverCommand.enqueueTurtleCommand("stop", 0); // run stop command
    }

    /** @type {TurtleViewControllerType} */
    const self = Object.freeze({
        "attachView": attachView,
        "detachView": detachView,
        "isViewAttached": isViewAttached,
        "updateView": updateView,
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "resetRoverButtons": resetRoverButtons,
        "stopRoverButton": stopRoverButton,
        "onMessage": onMessage,
    });

    return self;
}
