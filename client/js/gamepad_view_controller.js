/// <reference path="message_bus.js" />
/// <reference path="gamepad.js" />
/// <reference path="rollback_state.js" />
/// <reference path="view_state_tools.js" />
/// <reference path="view_widget_tools.js" />

/////////////////// Gamepad View Controller ////////////////////
/**
 * @typedef {object} GamePadViewControllerType
 * @property {() => number} getGamePadIndex
 * @property {() => number} getAxisOne 
 * @property {() => number} getAxisOneValue
 * @property {() => boolean} getAxisOneFlip
 * @property {() => number} getAxisOneZero
 * @property {() => number} getAxisTwo 
 * @property {() => number} getAxisTwoValue
 * @property {() => boolean} getAxisTwoFlip
 * @property {() => number} getAxisTwoZero
 * @property {() => GamePadViewControllerType} attachView
 * @property {() => GamePadViewControllerType} detachView
 * @property {() => boolean} isViewAttached
 * @property {() => GamePadViewControllerType} startListening
 * @property {() => GamePadViewControllerType} stopListening
 * @property {() => boolean} isListening
 * @property {() => GamePadViewControllerType} showView
 * @property {() => GamePadViewControllerType} hideView
 * @property {() => boolean} isViewShowing
 * @property {(force?: boolean) => GamePadViewControllerType} updateView
 * @property {(message: string, data: any, specifier?: string) => void} onMessage
 */

/**
 * Construct a GamePadViewController.
 * 
 * @param {HTMLElement} container, parent element
 * @param {string} cssSelectGamePad, css selector for gamepad select menu element
 * @param {string} cssSelectAxisOne, css selector for throttle axis select menu element
 * @param {string} cssSelectAxisTwo, css selector for steering axis select menu element
 * @param {string} cssAxisOneValue, css selector for throttle axis value text element
 * @param {string} cssAxisTwoValue, css selector for steering axis value test element
 * @param {string} cssAxisOneZero, css selector for axis zero value range element
 * @param {string} cssAxisTwoZero, css selector for axis zero value range element
 * @param {string} cssAxisOneFlip, css selector for axis flip (invert) checkbox element
 * @param {string} cssAxisTwoFlip, css selector for axis flip (invert) checkbox element
 * @param {MessageBusType} messageBus       //  IN: MessageBus
 */
function GamePadViewController(
    container,
    cssSelectGamePad,
    cssSelectAxisOne,
    cssSelectAxisTwo,
    cssAxisOneValue,
    cssAxisTwoValue,
    cssAxisOneZero,
    cssAxisTwoZero,
    cssAxisOneFlip,
    cssAxisTwoFlip,
    messageBus) 
{
    let _connectedGamePads = [];
    let _requestAnimationFrameNumber = 0;


    //
    // gamepad utilities
    //
    const gamepad = GamepadMapper();

    //
    // view state
    //
    const _gamePadState = RollbackState({
        // 
        // gamepad menu state
        //

        /** @type {string[]} */
        gamePadNames: [],   // [string]: array of connected controller names 
                            //           or empty array if no controller is connected

        /** @type {number[]} */
        gamePadIndices: [], // [integer]: array of integer where each integer is an index into navigator.getGamePads()
                            //            or empty array if no gamepad is connected.
        
        /** @type {number[]} */
        gamePadAxes: [],    // [integer]: array integer with axis count for each gamepad
        selected: -1,       // integer: index of selected gamepad into gamePadNames, gamePadIndices and gamePadAxes

        //
        // menu state
        //
        axisCount: 0,       // integer: number of axes on selected gamepad
        axisOne: 0,         // integer: index of axis for controlling throttle
        axisOneValue: 0.0,  // float: value -1.0 to 1.0 for throttle axis
        axisOneFlip: false, // boolean: true to invert axis value, false to use natural axis value
        axisOneZero: 0.15,   // float: value 0.0 to 1.0 for zero area of axis
        axisOneZeroLive: 0.15,   // float: value 0.0 to 1.0 for zero area of axis live update
        axisTwo: 0,         // integer: index of axis for controlling steering
        axisTwoValue: 0.0,  // float: value -1.0 to 1.0 for steering axis
        axisTwoFlip: false, // boolean: true to invert axis value, false to use natural axis value
        axisTwoZero: 0.15,   // float: value 0.0 to 1.0 for zero area of axis
        axisTwoZeroLive: 0.15,   // float: value 0.0 to 1.0 for zero area of axis live udpated
    });


    const _axisOneZero = RangeWidgetController(
        _gamePadState, "axisOneZero", "axisOneZeroLive", 
        1.0, 0.0, 0.01, 2, 
        cssAxisOneZero);

    const _axisTwoZero = RangeWidgetController(
        _gamePadState, "axisTwoZero", "axisTwoZeroLive", 
        1.0, 0.0, 0.01, 2, 
        cssAxisTwoZero);

    /**
     * Get the gamepad index of the selected gamepad.
     * 
     * @returns {number} // RET: index of selected gamepad
     *                           or -1 if no gamepad is selected. 
     */
    function getGamePadIndex() {
        const selected = _gamePadState.getValue("selected");
        return (selected >= 0) ?
            _gamePadState.getValue("gamePadIndices")[selected] :
            -1;
    }

    /**
     * Get the gamepad index of the first joystick axis.
     * This is the value for either throttle or for the 
     * left motor, depending on the drive mode.
     * 
     * @returns {number} // RET: -1.0 to 1.0
     */
    function getAxisOne() {
        return _gamePadState.getValue("axisOne");
    }

    /**
     * Get the current value of the first joystick axis.
     * This is the value for either throttle or for the 
     * left motor, depending on the drive mode.
     * 
     * @returns {number} // RET: -1.0 to 1.0
     */
    function getAxisOneValue() {
        return _gamePadState.getValue("axisOneValue");
    }

    /**
     * Determine if the first joystick axis value
     * should be flipped such that range of 
     * -1.0 to 1.0 is flipped to 1.0 to -1.0
     * 
     * @returns {boolean} // RET: true to invert axis value, false to use natural axis value
     */
    function getAxisOneFlip() {
        return _gamePadState.getValue("axisOneFlip");
    }

    /**
     * Get the value around zero that will be considered zero.
     * So if axis zero value is 0.15, then axis values
     * between -0.15 and 0.15 will be treated as zero.
     * This is to handle very noisy joysticks.
     * 
     * @returns {number}
     */
    function getAxisOneZero() {
        return _gamePadState.getValue("axisOneZero");
    }

    /**
     * Get the index of the second joystick axis.
     * This is the axis that controls steering or
     * the right motor, depending on the drive mode.
     * 
     * @returns {number}
     */
    function getAxisTwo() {
        return _gamePadState.getValue("axisTwo");
    }

    /**
     * Get the current value of the second joystick axis.
     * This is the value for either steering or for the 
     * right motor, depending on the drive mode.
     * 
     * @returns {number} // RET: -1.0 to 1.0
     */
    function getAxisTwoValue() {
        return _gamePadState.getValue("axisTwoValue");
    }

    /**
     * Determine if the second joystick axis value
     * should be flipped such that range of 
     * -1.0 to 1.0 is flipped to 1.0 to -1.0
     * 
     * @returns {boolean} // RET: true to invert axis value, false to use natural axis value
     */
    function getAxisTwoFlip() {
        return _gamePadState.getValue("axisTwoFlip");
    }

    /**
     * Get the value around zero that will be considered zero.
     * So if axis zero value is 0.15, then axis values
     * between -0.15 and 0.15 will be treated as zero.
     * This is to handle very noisy joysticks.
     * 
     * @returns {number}
     */
    function getAxisTwoZero() {
        return _gamePadState.getValue("axisTwoZero");
    }

    let gamePadSelect = undefined;
    let axisOneSelect = undefined;
    let axisTwoSelect = undefined;
    let axisOneText = undefined;
    let axisTwoText = undefined;
    let axisOneFlip = undefined;
    let axisTwoFlip = undefined;

    /**
     * Bind to the dom using the css values provided to the constructor.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function attachView() {
        if (!isViewAttached()) {
            gamePadSelect = container.querySelector(cssSelectGamePad);

            axisOneSelect = container.querySelector(cssSelectAxisOne);
            axisTwoSelect = container.querySelector(cssSelectAxisTwo);
            axisOneText = container.querySelector(cssAxisOneValue);
            axisTwoText = container.querySelector(cssAxisTwoValue);

            axisOneFlip = container.querySelector(cssAxisOneFlip);
            axisTwoFlip = container.querySelector(cssAxisTwoFlip);

            _axisOneZero.attachView();
            _axisTwoZero.attachView();
        }
        return self;
    }

    /**
     * Unbind from the dom.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function detachView() {
        if (isListening()) throw new Error("Attempt to detachView while still listening");
        if (isViewAttached()) {
            gamePadSelect = undefined;

            axisOneSelect = undefined;
            axisTwoSelect = undefined;
            axisOneText = undefined;
            axisTwoText = undefined;

            axisOneFlip = undefined;
            axisTwoFlip = undefined;

            _axisOneZero.detachView()
            _axisTwoZero.detachView();
        }
        return self;
    }

    /**
     * Determine if controller is bound to the dom.
     * 
     * @returns {boolean}
     */
    function isViewAttached() {
        return !!gamePadSelect;
    }

    //
    // attach listeners for connection events
    //
    let _listening = 0;

    /**
     * Start listening for dom events.
     * Each call to startListening() must be matched
     * to a call to stopListening() for listeners to be released.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function startListening() {
        _listening += 1;
        if (1 === _listening) {
            // listen for changes to list of gamepads
            if (messageBus) {
                // use message bus to get event from singleton listener
                messageBus.subscribe("gamepadconnected", self);
                messageBus.subscribe("gamepaddisconnected", self);
            } else {
                // listen for the event ourselves
                window.addEventListener("gamepadconnected", _onGamepadConnectedEvent);
                window.addEventListener("gamepaddisconnected", _onGamepadDisconnectedEvent);
            }

            if (gamePadSelect) {
                gamePadSelect.addEventListener("change", _onGamePadChanged);
            }
            if (axisOneSelect) {
                axisOneSelect.addEventListener("change", _onAxisOneChanged);
            }
            if (axisTwoSelect) {
                axisTwoSelect.addEventListener("change", _onAxisTwoChanged);
            }

            if (axisOneFlip) {
                axisOneFlip.addEventListener("change", _onAxisOneFlipChanged);
            }
            if (axisTwoFlip) {
                axisTwoFlip.addEventListener("change", _onAxisTwoFlipChanged);
            }

            _axisOneZero.startListening();
            _axisTwoZero.startListening();
        }

        // start updating
        if(_listening) {
            _gameloop(performance.now());
        }

        return self;
    }

    /**
     * Stop listening for dom events.
     * Each call to startListening() must be matched
     * to a call to stopListening() for listeners to be released.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            if (messageBus) {
                messageBus.unsubscribeAll(self);
            } else {
                window.removeEventListener("gamepadconnected", _onGamepadConnectedEvent);
                window.removeEventListener("gamepaddisconnected", _onGamepadDisconnectedEvent);
            }

            if (gamePadSelect) {
                gamePadSelect.removeEventListener("change", _onGamePadChanged);
            }
            if (axisOneSelect) {
                axisOneSelect.removeEventListener("change", _onAxisOneChanged);
            }
            if (axisTwoSelect) {
                axisTwoSelect.removeEventListener("change", _onAxisTwoChanged);
            }

            if (axisOneFlip) {
                axisOneFlip.removeEventListener("change", _onAxisOneFlipChanged);
            }
            if (axisTwoFlip) {
                axisTwoFlip.removeEventListener("change", _onAxisTwoFlipChanged);
            }

            _axisOneZero.stopListening();
            _axisTwoZero.stopListening();

            // stop updating
            window.cancelAnimationFrame(_requestAnimationFrameNumber);
        }
        return self;
    }

    /**
     * Determining if actively listening for dom events and messages.
     * 
     * @returns {boolean}
     */
    function isListening() {
        return _listening > 0;
    }

    let showing = 0;

    /**
     * Show the view.
     * Each call to showView() must be balanced with 
     * a call to hideView() for the view to be hidden.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function showView() {
        showing += 1;
        if (1 === showing) {
            show(container);
        }
        return self;
    }

    /**
     * Attempt to hide the view.
     * Each call to showView() must be balanced with 
     * a call to hideView() for the view to be hidden.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function hideView() {
        showing -= 1;
        if (0 === showing) {
            hide(container);
        }
        return self;
    }

    /**
     * Determine if the view is visible.
     * 
     * @returns {boolean}
     */
    function isViewShowing() {
        return showing > 0;
    }

    /**
     * Update values from view and if any values changed
     * then force a redraw of the view.
     * 
     * @param {boolean} force // IN : true to force redraw regardless of changed values
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function updateView(force = false) {
        _updateGamePadValues();
        _enforceGamePadView(force);
        return self;
    }

    /**
     * Called regularly to update values and redraw the view if necessary.
     * 
     * @private
     * @param {number} timeStamp // IN : time of current update
     */
    function _gameloop(timeStamp) {
        updateView();

        if (_listening) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_gameloop);
        }
    }

    /**
     * Update the gamepad values base on the view.
     * 
     * @private
     */
    function _updateGamePadValues() {
        _connectedGamePads = gamepad.connectedGamePads(navigator.getGamepads());

        const values = gamepad.mapGamePadValues(
            _connectedGamePads,
            getGamePadIndex(), [getAxisOne(), getAxisTwo()], []);

        _gamePadState.setValue("axisOneValue", values.axes.length >= 1 ? values.axes[0] : 0);
        _gamePadState.setValue("axisTwoValue", values.axes.length >= 2 ? values.axes[1] : 0);

        _axisTwoZero.updateViewState();
        _axisOneZero.updateViewState();
    }

    /**
     * Redraw the view if any backing values have changed.
     * Make the view match the state.
     * 
     * @private
     * @param {boolean} force // IN : true to force redraw regardless of changed values.
     */
    function _enforceGamePadView(force = false) {
        //
        // if we have a staged value, then
        // we need to update that ui element
        //
        _enforceGamePadMenu(gamePadSelect, force);
        _enforceGamePadSelection(gamePadSelect, force);

        //
        // if available axes have changed, then recreate options menus
        //
        const enforced = _enforceAxisOptions(axisOneSelect, "axisOne", force);
        ViewStateTools.enforceSelectMenu(_gamePadState, "axisOne", axisOneSelect, force);
        ViewStateTools.enforceText(_gamePadState, "axisOneValue", axisOneText, force);
        ViewStateTools.enforceCheck(_gamePadState, "axisOneFlip", axisOneFlip, force);
        _axisOneZero.enforceView(force);

        _enforceAxisOptions(axisTwoSelect, "axisTwo", enforced || force);
        ViewStateTools.enforceSelectMenu(_gamePadState, "axisTwo", axisTwoSelect, force);
        ViewStateTools.enforceText(_gamePadState, "axisTwoValue", axisTwoText, force);
        ViewStateTools.enforceCheck(_gamePadState, "axisTwoFlip", axisTwoFlip, force);
        _axisTwoZero.enforceView(force);
    }


    /**
     * Redraw the gamepad menu view if any backing values have changed.
     * Make the view match the state.
     * 
     * @private
     * @param {HTMLSelectElement} selectElement // IN : the menu view
     * @param {boolean} force // IN : true to force a redraw despite changed values.
     * @returns // RET: true if view was updated, false if not
     */
    function _enforceGamePadMenu(selectElement, force = false) {
        //
        // if we have a staged value, then
        // we need to update that ui element
        //
        if (force || _gamePadState.isStaged("gamePadNames")) {

            if (selectElement) {
                //
                // clear menu option and rebuild from state
                //
                _clearOptions(selectElement);
                const names = _gamePadState.commitValue("gamePadNames");
                const indices = _gamePadState.commitValue("gamePadIndices");
                _assert(names.length === indices.length);

                if (names.length > 0) {
                    for (let i = 0; i < names.length; i += 1) {
                        const option = document.createElement("option");
                        option.text = names[i];
                        option.value = indices[i];
                        selectElement.appendChild(option);
                    }
                    selectElement.classList.remove("disabled");
                } else {
                    selectElement.classList.add("disabled");

                }
                return true;
            }
        }

        return false;
    }

    /**
     * Redraw the gamepad selection if any backing values have changed.
     * Make the view match the state.
     * 
     * @private
     * @param {HTMLSelectElement} selectElement // IN : menu view
     * @param {boolean} force // IN : true to force a redraw regardless of changed values.
     * @returns // RET: true if view was redrawn, false if not.
     */
    function _enforceGamePadSelection(selectElement, force = false) {
        //
        // if we have a staged value, then
        // we need to update that ui element
        //
        if (force || _gamePadState.isStaged("selected")) {
            if (selectElement) {
                const selected = _gamePadState.commitValue("selected");
                selectElement.value = selected;

                // update axis count for selected controller
                _gamePadState.setValue("axisCount",
                    (selected >= 0) ?
                    _gamePadState.getValue("gamePadAxes")[selected] :
                    0);
                return true;
            }
        }

        return false;
    }


    /**
     * Enforce the axis menu's list of options if they have changed;
     * make the view match the state.
     * 
     * @private
     * @param {HTMLSelectElement} selectElement // IN : menu view
     * @param {string} selectorValue // IN : menu css selector
     * @param {boolean} force // RET: true to force a redraw regardless of changed values.
     * @returns {boolean} // RET: true if redrawn, false if not
     */
    function _enforceAxisOptions(selectElement, selectorValue, force = false) {
        //
        // enforce the select's option list
        //
        if (force || _gamePadState.isStaged("axisCount")) {
            if (selectElement) {
                //
                // clear menu options and rebuild from state
                //
                _clearOptions(selectElement);
                const axisCount = _gamePadState.commitValue("axisCount");
                if (axisCount > 0) {
                    for (let i = 0; i < axisCount; i += 1) {
                        const option = document.createElement("option");
                        option.text = `axis ${i}`;
                        option.value = i.toString();
                        selectElement.appendChild(option);
                    }
                    selectElement.classList.remove("disabled");
                } else {
                    selectElement.classList.add("disabled");
                }
                selectElement.value = _gamePadState.commitValue(selectorValue);

                return true;
            }
        }
        return false;
    }


    /**
     * Update the connected gamepads state.
     * 
     * @private
     */
    function _updateConnectedGamePads() {
        _connectedGamePads = gamepad.connectedGamePads(navigator.getGamepads());

        //
        // update the gamepad state with newly connected gamepad
        //
        const gamePads = _connectedGamePads;
        const names = gamePads.map(g => g.id);
        const indices = gamePads.map(g => g.index);
        const axes = gamePads.map(g => g.axes.length);

        _gamePadState.setValue("gamePadNames", names);
        _gamePadState.setValue("gamePadIndices", indices);
        _gamePadState.setValue("gamePadAxes", axes);

        //
        // handle case where gamepads are available, but
        // we don't have one selected; select the first one.
        //
        if(names.length > 0) {
            //
            // there is a gamepad available, but none is selected
            // or selection is out of range, then select the first one.
            //
            const selected = _gamePadState.getValue("selected");
            const hasSelected = ("number" === typeof selected) && (selected >= 0) && (indices.indexOf(selected) >= 0);
            if(!hasSelected) {
                _gamePadState.setValue("selected", gamePads[0].index);
                _gamePadState.setValue("axisCount", axes[0]);
                _gamePadState.setValue("axisOne", 0);
                _gamePadState.setValue("axisOneValue", 0.0);
                _gamePadState.setValue("axisTwo", 0);
                _gamePadState.setValue("axisTwoValue", 0.0);
            }
        } else {
            _gamePadState.setValue("selected", -1);
            _gamePadState.setValue("axisCount", 0);
            _gamePadState.setValue("axisOne", 0);
            _gamePadState.setValue("axisOneValue", 0.0);
            _gamePadState.setValue("axisTwo", 0);
            _gamePadState.setValue("axisTwoValue", 0.0);
        }
    }


    /**
     * When a gamepad is connected, update the connect gamepad state.
     * 
     * @private
     * @param {Gamepad} gamepad 
     */
    function _onGamepadConnected(gamepad) {
        // update state with new list of gamepads
        _updateConnectedGamePads();
        _gamePadState.setValue("selected", gamepad.index);
        _gamePadState.setValue("axisCount", gamepad.axes.length);
    }

    /**
     * Shim that gets event when a gamepad is connnected.
     * 
     * @private
     * @param {GamepadEvent} event 
     */
    function _onGamepadConnectedEvent(event) {
        _onGamepadConnected(event.gamepad);
    }

    /**
     * Called when a gamepad is disconnected.
     * Update the list of connected gamepads and
     * if the selected gamepad is the one being
     * disconnected, then reset the selection.
     * 
     * @param {Gamepad} gamepad 
     */
    function _onGamepadDisconnected(gamepad) {
        //
        // if the currently selected gamepad is disconnected,
        // then reset the selected value.
        //
        _gamePadState.setValue("selected", -1);
        _gamePadState.setValue("axisCount", 0);
        _updateConnectedGamePads();
    }

    /**
     * Shim that gets event when a gamepad is disconnected.
     * 
     * @param {GamepadEvent} event 
     */
    function _onGamepadDisconnectedEvent(event) {
        _onGamepadDisconnected(event.gamepad);
    }

    /**
     * Event Handler called when selected gamepad is changed in UI.
     * 
     * @param {Event & {target: HTMLSelectElement}} event 
     */
    function _onGamePadChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        if (event.target) {
            console.log(`_onGamePadChanged(${event.target.value})`);
            _gamePadState.setValue("selected", parseInt(event.target.value));
            _updateConnectedGamePads();
        }
    }

    /**
     * Event handler called when axis one selection changes.
     * 
     * @param {Event & {target: HTMLSelectElement}} event 
     */
    function _onAxisOneChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisOne", parseInt(event.target.value));
    }

    /**
     * Event handler called when axis two selection changes.
     * 
     * @param {Event & {target: HTMLSelectElement}} event 
     */
    function _onAxisTwoChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisTwo", parseInt(event.target.value));
    }

    /**
     * Event handler called when axis one flip checkbox is changed.
     * 
     * @param {Event & {target: HTMLInputElement}} event 
     */
    function _onAxisOneFlipChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisOneFlip", event.target.checked);
    }

    /**
     * Event handler called when axis two flip checkbox is changed.
     * 
     * @param {Event & {target: HTMLInputElement}} event 
     */
    function _onAxisTwoFlipChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisTwoFlip", event.target.checked);
    }

    /**
     * Clear all the select menu options.
     * 
     * @param {HTMLSelectElement} select 
     */
    function _clearOptions(select) {
        ViewWidgetTools.clearSelectOptions(select);
    }

    /**
     * Assert a value and throw error if it evaluates to false.
     * 
     * @param {boolean} test 
     * @throws {Error} if test is false
     */
    function _assert(test) {
        if (!test) {
            throw new Error();
        }
    }

    /**
     * Message handler.
     * 
     * @param {string} message 
     * @param {any} data 
     * @param {string | undefined} specifier
     */
    function onMessage(message, data, specifier=undefined) {
        switch (message) {
            case "gamepadconnected":
                {
                    _onGamepadConnected(data);
                    return;
                }
            case "gamepaddisconnected":
                {
                    _onGamepadDisconnected(data);
                    return;
                }
            default:
                {
                    console.log("Unhandled message in GamePadViewController");
                }
        }
    }

    //
    // public methods
    //
    /** @type {GamePadViewControllerType} */
    const self = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "attachView": attachView,
        "detachView": detachView,
        "isViewAttached": isViewAttached,
        "showView": showView,
        "hideView": hideView,
        "isViewShowing": isViewShowing,
        "updateView": updateView,
        "getGamePadIndex": getGamePadIndex,
        "getAxisOne": getAxisOne,
        "getAxisOneValue": getAxisOneValue,
        "getAxisOneFlip": getAxisOneFlip,
        "getAxisOneZero": getAxisOneZero,
        "getAxisTwo": getAxisTwo,
        "getAxisTwoValue": getAxisTwoValue,
        "getAxisTwoFlip": getAxisTwoFlip,
        "getAxisTwoZero": getAxisTwoZero,
        "onMessage": onMessage,
    }

    return self;
}
