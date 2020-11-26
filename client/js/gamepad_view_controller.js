// import MessageBus from './message_bus.js'
// import GamePad from './gamepad.js'
// import RollbackState from './rollback_state.js'
// import ViewStateTools from './view_state_tools.js'
// import ViewWidgetTools from './view_widget_tools.js'

/////////////////// Gamepad View Controller ////////////////////
/**
 * Construct a GamePadViewController.
 * 
 * @param string container, parent element
 * @param string cssSelectGamePad, css selector for gamepad select menu element
 * @param string cssSelectAxisOne, css selector for throttle axis select menu element
 * @param string cssSelectAxisTwo, css selector for steering axis select menu element
 * @param string cssAxisOneValue, css selector for throttle axis value text element
 * @param string cssAxisTwoValue, css selector for steering axis value test element
 * @param string cssAxisOneZero, css selector for axis zero value range element
 * @param string cssAxisTwoZero, css selector for axis zero value range element
 * @param string cssAxisOneZeroValue, css selector for axis zero value text element
 * @param string cssAxisTwoZeroValue, css selector for axis zero value text element
 * @param string cssAxisOneFlip, css selector for axis flip (invert) checkbox element
 * @param string cssAxisTwoFlip, css selector for axis flip (invert) checkbox element
 * @param {object} messageBus       //  IN: MessageBus
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

    //
    // gamepad utilities
    //
    const gamepad = Gamepad();

    //
    // view state
    //
    const _gamePadState = RollbackState({
        // 
        // gamepad menu state
        //
        gamePadNames: [],   // [string]: array of connected controller names 
                            //           or empty array if no controller is connected
        gamePadIndices: [], // [integer]: array of integer where each integer is an index into navigator.getGamePads()
                            //            or empty array if no gamepad is connected.
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

    function getGamePadIndex() {
        const selected = _gamePadState.getValue("selected");
        return (selected >= 0) ?
            _gamePadState.getValue("gamePadIndices")[selected] :
            -1;
    }

    function getAxisOne() {
        return _gamePadState.getValue("axisOne");
    }

    function getAxisOneValue() {
        return _gamePadState.getValue("axisOneValue");
    }

    function getAxisOneFlip() {
        return _gamePadState.getValue("axisOneFlip");
    }

    function getAxisOneZero() {
        return _gamePadState.getValue("axisOneZero");
    }

    function getAxisTwo() {
        return _gamePadState.getValue("axisTwo");
    }

    function getAxisTwoValue() {
        return _gamePadState.getValue("axisTwoValue");
    }

    function getAxisTwoFlip() {
        return _gamePadState.getValue("axisTwoFlip");
    }

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

    function detachView() {
        if (listening) throw new Error("Attempt to detachView while still listening");
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

    function isViewAttached() {
        return !!gamePadSelect;
    }

    //
    // attach listeners for connection events
    //
    let _listening = 0;

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
            window.cancelAnimationFrame(_gameloop);
        }
        return self;
    }

    function isListening() {
        return _listening > 0;
    }

    let showing = 0;

    function showView() {
        showing += 1;
        if (1 === showing) {
            show(container);
        }
        return self;
    }

    function hideView() {
        showing -= 1;
        if (0 === showing) {
            hide(container);
        }
        return self;
    }

    function isViewShowing() {
        return showing > 0;
    }

    function updateView(force = false) {
        _updateGamePadValues();
        _enforceGamePadView(force);
        return self;
    }

    //
    // gameloop checks selected gamepad and updated values
    //
    function _gameloop(timeStamp) {
        updateView();

        if (_listening) {
            window.requestAnimationFrame(_gameloop);
        }
    }

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
     * Enforce the select menu's list of options if they have changed.
     * 
     * @param {*} cssSelector 
     * @param {*} selectorValue 
     * @param {*} force 
     * @returns boolean; true if enforced, false if not
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
                        option.value = i;
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
     * When a gamepad is connected, update the gamepad config UI
     * 
     * @param {*} event 
     */
    function _onGamepadConnected(gamepad) {
        // update state with new list of gamepads
        _updateConnectedGamePads();
        _gamePadState.setValue("selected", gamepad.index);
        _gamePadState.setValue("axisCount", gamepad.axes.length);
    }

    function _onGamepadConnectedEvent(event) {
        _onGamepadConnected(event.gamepad);
    }

    /**
     * Called when a gamepad is disconnected.
     * Update the list of connected gamepads and
     * if the selected gamepad is the one being
     * disconnected, then reset the selection.
     * 
     * @param {*} event 
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

    function _onGamepadDisconnectedEvent(event) {
        _onGamepadDisconnected(event.gamepad);
    }

    function _onGamePadChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        console.log(`_onGamePadChanged(${event.target.value})`);
        _gamePadState.setValue("selected", parseInt(event.target.value));
        _updateConnectedGamePads();
    }

    function _onAxisOneChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisOne", parseInt(event.target.value));
    }

    function _onAxisTwoChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisTwo", parseInt(event.target.value));
    }

    function _onAxisOneFlipChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisOneFlip", event.target.checked);
    }

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
     * @param {Element} select 
     */
    function _clearOptions(select) {
        ViewWidgetTools.clearSelectOptions(select);
    }

    function _assert(test) {
        if (!test) {
            throw new Error();
        }
    }

    function onMessage(message, data) {
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
