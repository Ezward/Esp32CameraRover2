//////////// bundle.js //////////////


///////////////// Web Socket for Rover Commands /////////////////
function CommandSocket(hostname, port=82) {
    //
    // stream images via websocket port 81
    //
    var socket = null;

    function isStarted() {
        return !!socket;
    }

    function isReady() {
        return socket && (WebSocket.OPEN === socket.readyState);
    }

    //
    // while a command is sent, but not acknowledge
    // isSending() is true and getSending() is the command
    //
    let _sentCommand = "";
    function isSending() {
        return "" !== _sentCommand;
    }
    function getSending() {
        return _sentCommand;
    }

    //
    // If a command is not acknowledged, then
    // isError() is true and getError() is the error
    // message returned by the server is and 'ERROR()' frame.
    //
    let _errorMessage = "";
    function hasError() {
        return "" !== _errorMessage;
    }
    function getError() {
        return _errorMessage;
    }


    //
    // clear the sending and error state
    // so we can send another message.
    // 
    function clearError() {
        _sentCommand = "";
        _errorMessage = "";
    }

    //
    // reset the socket connection
    //
    function reset() {
        stop();
        start();
        clearError();
    }

    function sendCommand(textCommand, force = false) {

        if(!force) {
            // make sure we have completed last send
            if(!isReady()) return false;
            if(isSending()) return false;
            if(hasError()) return false;
        }

        if(!textCommand) {
            _errorMessage = "ERROR(empty)"
            return false;
        }

        try {
            console.log("CommandSocket.send: " + textCommand);
            socket.send(_sentCommand = textCommand);
            return true;
        } 
        catch(error) {
            console.log("CommandSocket error: " + error);
            _errorMessage = `ERROR(${error})`;
            return false;
        }
    }

    function start() {
        socket = new WebSocket(`ws://${hostname}:${port}/command`, ['arduino']);
        socket.binaryType = 'arraybuffer';

        try {
            socket.onopen = function () {
                console.log("CommandSocket opened");
            }

            socket.onmessage = function (msg) {
                if("string" === typeof msg.data) {
                    if(msg.data.startsWith("log(")) {
                        // just reflect logs to the console for now
                        console.log(`CommandSocket: ${msg.data}`);
                    } else if(msg.data.startsWith("tel(")) {
                        // just reflect telemetry to console for now
                        console.log(`CommandSocket: ${msg.data}`);
                    } else if(msg.data.startsWith("set(")) {
                        // just reflect settings to console for now
                        console.log(`CommandSocket: ${msg.data}`);
                    } else if(msg.data.startsWith("cmd(") && isSending()) {
                        // this should be the acknowledgement of the sent command
                        if(_sentCommand === msg.data) {
                            console.log(`CommandSocket: ${_sentCommand} Acknowledged`);
                            _sentCommand = "";   // SUCCESS, we got our command ack'd
                        } else {
                            console.log(`CommandSocket: ${_sentCommand} Not Acknowledged: ${msg.data}`);
                            _errorMessage = `ERROR(${msg})`;
                        }
                    } else {
                        console.log(`CommandSocket received unexpected text message: ${msg.data}`);
                    }
                } else {
                    console.warn("CommandSocket received unexpected binary message.");
                }
            };

            socket.onclose = function () {
                console.log("CommandSocket closed");
                socket = null;
            }
        } catch (exception) {
            console.log("CommandSocket exception: " + exception);
        }
    }

    function stop() {
        if (socket) {
            if ((socket.readyState !== WebSocket.CLOSED) && (socket.readyState !== WebSocket.CLOSING)) {
                socket.close();
            }
            socket = null;
        }
    }

    const exports = {
        "start": start,
        "stop": stop,
        "isStarted": isStarted,
        "reset": reset,
        "isReady": isReady,
        "sendCommand": sendCommand,
        "isSending": isSending,
        "getSending": getSending,
        "hasError": hasError,
        "getError": getError,
        "clearError": clearError,
    }
    return exports;
}
//
///////////////// dom utilities //////////////
//

// Hide the element
const hide = el => {
    el.classList.add('hidden')
}

// show the element
const show = el => {
    el.classList.remove('hidden')
}

// disable the element
const disable = el => {
    el.classList.add('disabled')
    el.disabled = true
}

// enable the element
const enable = el => {
    el.classList.remove('disabled')
    el.disabled = false
}
/////////////////// utilities /////////////////
function assert(assertion) {
    if (true != assertion) {
        throw new Error("assertion failed");
    }
}

/*
** absolute value of a number
*/
function abs(x) {
    if("number" !== typeof x) throw new TypeError();
    return (x >= 0) ? x : -x;
}

/*
** coerce number to an integer
*/
function int(x) {
    if("number" !== typeof x) throw new TypeError();
    return x | 0;
}

/*
** constrain a value to a range.
** if the value is < min, then it becomes the min.
** if the value > max, then it becomes the max.
** otherwise it is unchanged.
*/
function constrain(value, min, max) {
    if (typeof value !== "number") throw new TypeError();
    if (typeof min !== "number") throw new TypeError();
    if (typeof max !== "number") throw new TypeError();
    if (min > max) throw new Error();

    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/*
** map a value in one range to another range
*/
function map(value, fromMin, fromMax, toMin, toMax) {
    if (typeof value !== "number") throw new TypeError();
    if (typeof fromMin !== "number") throw new TypeError();
    if (typeof fromMax !== "number") throw new TypeError();
    if (typeof toMin !== "number") throw new TypeError();
    if (typeof toMax !== "number") throw new TypeError();

    const fromRange = fromMax - fromMin;
    const toRange = toMax - toMin;
    return (value - fromMin) * toRange / fromRange + toMin
}

/*
** create a new list by keeping all elements in the original list
** that return true when passed to the given filterFunction
** and discarding all other elements.
**
** NOTE: This is safe to use on result of document.querySelectorAll(),
**       which does not have a filter() method.
*/
function filterList(list, filterFunction) {
    var elements = [];

    // Loop through each element, apply filter and push to the array
    if (filterFunction) {
        for (let i = 0; i < list.length; i += 1) {
            const element = list[i];
            if (filterFunction(element)) {
                elements.push(element);
            }
        }
    }
    return elements;
}

/*
** remove the first matching element from the list
*/
function removeFirstFromList(list, element) {
    if (list) {
        const index = list.indexOf(element);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }
}

/*
** remove all matching elements from the list
*/
function removeAllFromList(list, element) {
    if (list) {
        let index = list.indexOf(element);
        while (index >= 0) {
            list.splice(index, 1);
            index = list.indexOf(element, index);
        }
    }
}
////////////// fetch utilities ///////////////

/**
 * fetch wrapped with a response timeout
 */
function fetchWithTimeout(url, timeoutMs = 2000) {
    let didTimeOut = false;

    return new Promise(function (resolve, reject) {
        const timeout = setTimeout(function () {
            didTimeOut = true;
            reject(new Error('Request timed out'));
        }, timeoutMs);

        fetch(url)
            .then(function (response) {
                // Clear the timeout as cleanup
                clearTimeout(timeout);
                if (!didTimeOut) {
                    console.log('fetch good! ', response);
                    resolve(response);
                }
            })
            .catch(function (err) {
                console.log('fetch failed! ', err);

                // Rejection already happened with setTimeout
                if (didTimeOut) return;
                // Reject with error
                reject(err);
            });
    })
}
///////////////// Gamepad Utilities ////////////////
function Gamepad() {

    /**
     * filter list of gamepads and return
     * only connected gamepads.
     */
    function connectedGamePads(gamepads) {
        const connected = []
        if (gamepads && gamepads.length) {
            for (let i = 0; i < gamepads.length; i += 1) {
                const gamepad = gamepads[i];
                if (gamepad && gamepad.connected) {
                    connected.push(gamepad);
                }
            }
        }
        return connected;
    }


    /**
     * Map a button value of 0.0 to 1.0 to given range.
     * 
     * @param {number} buttonValue, between 0.0 and 1.0
     * @param {number} start, range start inclusive (start may be >= end)
     * @param {number} end, range end includes (end may be <= start)
     * @returns {number} in range of start to end inclusive
     */
    function mapButtonRange(buttonValue, start, end) {
        if (typeof buttonValue !== "number") throw new TypeError();
        if (typeof start !== "number") throw new TypeError();
        if (typeof end !== "number") throw new TypeError();

        //
        // map button's value of 0.0 to 1.0
        // to range start to end
        //
        return buttonValue * (end - start) + start;
    }


    /**
     * Map an axis value of -1.0 to 1.0 to given range.
     * 
     * @param {number} axisValue, between -1.0 and 1.0
     * @param {number} start, range start inclusive (start may be >= end)
     * @param {number} end, range end includes (end may be <= start)
     * @returns {number} in range of start to end inclusive
     */
    function mapAxisRange(axisValue, start, end) {
        if (typeof axisValue !== "number") throw new TypeError();
        if (typeof start !== "number") throw new TypeError();
        if (typeof end !== "number") throw new TypeError();

        //
        // map axis' value of -1.0 to 1.0
        // to range start to end
        //
        return ((axisValue + 1) / 2) * (end - start) + start;
    }


    /**
     * Get values of buttons and axes of interest for the requested gamepad.
     * The order of returned values is the same as the order of the indices
     * in the array arguments; so the caller can create a mapping by
     * deciding which values and in what order they should be returned.
     * 
     * @param number gamePadIndex        : index of gamePad in array of gamePads returned by navigator.getGamepads()
     * @param [number] axesOfInterest    : list of indices of the axis to read (returned in this order)
     * @param [number] buttonsOfInterest : list of indices of the buttons to read (returned in this order)
     * @return {axes: [number], buttons: [number]} value axes and buttons requested in specified 
     *                                             in axesOfInterest and buttonsOfInterest;
     *                                             value is 0.0 to 1.0 for buttons,
     *                                             value is -1.0 to 1.0 for axes 
     */
    function mapGamePadValues(gamepads, gamePadIndex, axesOfInterest, buttonsOfInterest) {
        let state = {
            axes: [],
            buttons: []
        };

        if (gamepads && (gamepads.length > 0)) {
            const gamepad = gamepads[gamePadIndex];
            if (gamepad) {
                for (let i = 0; i < axesOfInterest.length; i += 1) {
                    const axesIndex = axesOfInterest[i];
                    state.axes.push(gamepad.axes[axesIndex]);
                }
                for (let i = 0; i < buttonsOfInterest.length; i += 1) {
                    const buttonIndex = buttonsOfInterest[i];
                    state.buttons.push(gamepad.buttons[buttonIndex]);
                }
            }
        }

        return state;
    }

    const exports = {
        "mapGamePadValues": mapGamePadValues,
        "mapAxisRange": mapAxisRange,
        "mapButtonRange": mapButtonRange,
        "connectedGamePads": connectedGamePads,
    }

    return exports;
}
// import MessageBus from './message_bus.js'

/**
 * Listen for gamepadconnected and gamepaddisconnected events
 * and republush them on the given message bus
 */
function GamepadListener(messageBus) {
    if (!messageBus) throw new Error("messageBus must be provided");

    window.addEventListener("gamepadconnected", _onGamepadConnected);
    window.addEventListener("gamepaddisconnected", _onGamepadDisconnected);

    let gamePadCount = 0;

    function getConnectedCount() {
        return gamePadCount;
    }

    /**
     * When a gamepad is connected, update the gamepad config UI
     * 
     * @param {*} event 
     */
    function _onGamepadConnected(event) {
        console.log(`Connected ${event.gamepad.id} at index ${event.gamepad.index}`);
        gamePadCount += 1;

        // publish message that gamepad list has changed
        if (messageBus) {
            messageBus.publish("gamepadconnected", event.gamepad);
        }
    }

    /**
     * Called when a gamepad is disconnected.
     * Update the list of connected gamepads and
     * if the selected gamepad is the one being
     * disconnected, then reset the selection.
     * 
     * @param {*} event 
     */
    function _onGamepadDisconnected(event) {
        console.log(`Disconnected ${event.gamepad.id} at index ${event.gamepad.index}`);
        gamePadCount -= 1;

        // publish message that gamepad list has changed
        if (messageBus) {
            messageBus.publish("gamepaddisconnected", event.gamepad);
        }
    }

    const exports = {
        "getConnectedCount": getConnectedCount,
    }

    return exports;
}
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

/////////////// message bus //////////////////
function MessageBus() {
    const subscriptions = {};

    function subscribe(message, subscriber) {
        if (!subscriber) throw new TypeError("Missing subscriber");
        if ("function" !== typeof subscriber["onMessage"]) throw new TypeError("Invalid subscriber");
        if ("string" != typeof message) throw new TypeError("Invalid message");

        let subscribers = subscriptions[message];
        if (!subscribers) {
            subscriptions[message] = (subscribers = []);
        }
        subscribers.push(subscriber);
    }

    function unsubscribe(message, subscriber) {
        const subscribers = subscriptions[message];
        if(subscribers) {
            removeFirstFromList(subscribers, subscriber);
        }
    }

    function unsubscribeAll(subscriber) {
        for(const message in subscriptions) {
            if(subscriptions.hasOwnProperty(message)) {
                const subscribers = subscriptions[message];
                if(subscribers) {
                    removeAllFromList(subscribers, subscriber);
                }
            }
        }
    }

    function publish(message, data = null, subscriber = null) {
        if ("string" != typeof message) throw new ValueError("Invalid message");

        if (subscriber) {
            // direct message
            if ("function" !== typeof subscriber["onMessage"]) throw new ValueError("Invalid subscriber");

            subscriber.onMessage(message, data);
        } else {
            // broadcase message
            subscribers = subscriptions[message];
            if (subscribers) {
                subscribers.forEach(subscriber => subscriber.onMessage(message, data));
            }
        }
    }

    const exports = {
        "publish": publish,
        "subscribe": subscribe,
        "unsubscribe": unsubscribe,
        "unsubscribeAll": unsubscribeAll,
    }

    return exports;
}
// import RollbackState from "./rollback_state.js"
// import int from "./utilities.js"
// import (_enforceText, _enforceRange) from "./view_state_tools.js"
// import RoverCommand from "./rover_command.js"
// import ViewStateTools from "./view_state_tools.js"
// import RangeWidgetController from "./range_widget_controller.js"

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

    //
    // view dom attachment
    //
    let container = undefined;

    const _motorOneStallRange = RangeWidgetController(
        _state, "motorOneStall", "motorOneStallLive", 
        1.0, 0.0, 0.01, 2, 
        cssMotorOneStall);

    const _motorTwoStallRange = RangeWidgetController(
        _state, "motorTwoStall", "motorTwoStallLive", 
        1.0, 0.0, 0.01, 2, 
        cssMotorTwoStall);


    function isViewAttached() {
        return !!container;
    }

    function attachView() {
        if (!isViewAttached()) {
            container = document.querySelector(cssContainer);

            _motorOneStallRange.attachView();
            _motorTwoStallRange.attachView();
        }
        return self;
    }

    function detachView() {
        if (listening) throw new Error("Attempt to detachView while still listening");
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
    function isListening() {
        return _listening > 0;
    }

    function startListening(roverCommand) {
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

    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            _motorOneStallRange.stopListening();
            _motorTwoStallRange.stopListening();

            // stop updating
            window.cancelAnimationFrame(_gameloop);
        }
        return self;
    }

    //
    // view visibility
    //
    let showing = 0;

    function isViewShowing() {
        return showing > 0;
    }

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

    //
    // render/update view
    //
    function updateView(force = false) {
        _motorOneStallRange.updateViewState(force);
        _motorTwoStallRange.updateViewState(force);
        _enforceView(force);
        return self;
    }

    function _enforceView(force = false) {
        _syncValues = _motorOneStallRange.enforceView(force) || _syncValues;
        _syncValues = _motorTwoStallRange.enforceView(force) || _syncValues;
    }

    function _isMotorStallValid(value) {
        return (typeof value == "number") && (value >= 0) && (value <= 1);
    }

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

    /**
     * Periodically update view and sync values to rover.
     * 
     * @param {*} timeStamp 
     */
    function _gameloop(timeStamp) {
        updateView();
        _syncMotorStall();

        if (_listening) {
            window.requestAnimationFrame(_gameloop);
        }
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
        "updateView": updateView,
    }

    return self;
}// import ViewStateTools from './view_state_tools.js'
// import ViewWidgetTools from './view_widget_tools.js'


/**
 * Construct controller for a multi-element range 
 * (slider) control with increment/decrement controls,
 * value display and live update.
 * 
 * @param {RollbackState} rollbackState // IN : state with value and live update value
 *                                      // OUT: state updated on calls to updateView()
 *                                              and/or enforceView()
 * @param {string} key                  // IN : state key for range value
 * @param {string} liveKey              // IN : state key for live update value
 * @param {number} maxRange             // IN : minimum allowed range value inclusive
 * @param {number} minRange             // IN : maximum allowed range value inclusive
 * @param {number} increment            // IN : amound to inc/dec value by using slider or buttons
 * @param {number} decimals             // IN : integer, number of decimals in range value text 
 * @param {string} cssContainer         // IN : css selector for range widget container element
 * @param {string} cssInput             // IN : css selector for range input element
 * @param {string} cssText              // IN : css selector for range value text element
 * @param {string} cssInc               // IN : css selector for increment button element
 * @param {string} cssDec               // IN : css selector for decrement button element
 * @returns {RangeWidgetController}     // RET: RangeWidgetController instance
 */
function RangeWidgetController(
    rollbackState, key, liveKey, 
    maxRange, minRange, increment, decimals, 
    cssContainer, 
    cssInput = "input[type=range]", cssText = ".range-value", cssInc = ".range-max", cssDec = ".range-min") 
{
    let _container = undefined;
    let _rangeInput = undefined;
    let _rangeText = undefined;
    let _rangeInc = undefined;
    let _rangeDec = undefined;
    
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
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);
        if(!_container) throw Error(`${cssContainer} not found`);

        _rangeInput = _container.querySelector(cssInput);
        _rangeText = _container.querySelector(cssText);

        _rangeInc = _container.querySelector(cssInc);
        _rangeDec = _container.querySelector(cssDec);
        
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

            _rangeInput = undefined;
            _rangeText = undefined;
    
            _rangeInc = undefined;
            _rangeDec = undefined;
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
                _rangeInput.addEventListener("change", _onChanged);
                _rangeInput.addEventListener("input", _onLiveUpdate);

                _rangeInc.addEventListener("click", _onIncrement);
                _rangeDec.addEventListener("click", _onDecrement);
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
                _rangeInput.removeEventListener("change", _onChanged);
                _rangeInput.removeEventListener("input", _onLiveUpdate);

                _rangeInc.removeEventListener("click", _onIncrement);
                _rangeDec.removeEventListener("click", _onDecrement);
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

    /**
     * Update view state and render if changed.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns {RangeWidgetController} this RangeWidgetController instance
     */
    function updateView(force = false) {
        // make sure live state matches state of record
        updateViewState(force).enforceView(force);
        return self;
    }

    /**
     * Update view state.
     * 
     * @param {boolean} force // IN : true to force update, 
     *                        //      false to update only on change.
     * @returns {RangeWidgetController} this RangeWidgetController instance
     */
    function updateViewState(force = false) {
        // make sure live state matches state of record
        if(force || rollbackState.isStaged(key)) {
            rollbackState.setValue(liveKey, rollbackState.getValue(key));
        }
        return self;
    }

    /**
     * Make the view match the state.
     * 
     * @param {boolean} force   // IN : true to force re-render
     * @returns {boolean}       // RET: true if range state value (rollbackState.get(key)) is updated,
     *                                  false otherwise.
     */
    function enforceView(force = false) {
        updated = ViewStateTools.enforceInput(rollbackState, key, _rangeInput, force);
        ViewStateTools.enforceText(rollbackState, liveKey, _rangeText, force || updated);
        return updated; // return true if make state value was updated
    }


    function _onChanged(event) {
        // update state to cause a redraw on game loop
        const value = parseFloat(event.target.value)
        rollbackState.setValue(key, value);
        rollbackState.setValue(liveKey, value);
    }

    function _onLiveUpdate(event) {
        // update state to cause a redraw on game loop
        rollbackState.setValue(liveKey, parseFloat(event.target.value));
    }

    function _onIncrement(event) {
        // update state to cause a redraw on game loop
        ViewWidgetTools.onRangeIncrement(rollbackState, key, liveKey, increment, maxRange, decimals);
    }
    function _onDecrement(event) {
        // update state to cause a redraw on game loop
        ViewWidgetTools.onRangeDecrement(rollbackState, key, liveKey, increment, minRange, decimals);
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
        "updateView": updateView,
        "updateViewState": updateViewState,
        "enforceView": enforceView,
    }

    return self;
}

/////////////// RollbackState ////////////////
//
// Key/Value store where values can be staged
// and then committed or rolled back.
// Staged values can be used as a 'diff' 
// between a new state and the prior state.
//
//   let state = RollbackState();
//   state.setValue("foo", "bar");
//   let value = state.getValue("foo");
//
function RollbackState(defaultState = {}) {
    const baseState = { ...defaultState }; // default committed state
    let committed = { ...defaultState }; // committed state
    let staged = {}; // newly staged state

    const _assertKey = function (key) {
        if ((typeof key !== "string") || ("" === key)) {
            throw TypeError()
        }
    }

    /**
     * Stage the value if it has changed.
     * 
     * @param {*} key 
     * @param {*} value 
     */
    const setStagedValue = function (key, value) {
        _assertKey(key);
        staged[key] = value;
    }

    const getStagedValue = function (key) {
        _assertKey(key);
        return staged[key];
    }

    const getStagedKeys = function () {
        return staged.keys();
    }

    /**
     * Determine if a key has a staged value.
     * 
     * @param {*} key 
     */
    const isStaged = function (key) {
        _assertKey(key);
        return staged.hasOwnProperty(key);
    }

    /**
     * Determine if a key has a committed value.
     * 
     * @param {*} key 
     */
    const isCommitted = function (key) {
        _assertKey(key);
        return committed.hasOwnProperty(key);
    }

    /**
     * Determine if the key is in the state
     * as either a staged or committed.
     * 
     * @param {*} key 
     */
    const hasValue = function (key) {
        _assertKey(key);
        return isStaged(key) || isCommitted(key);
    }

    /**
     * Determine if a key has a staged value, but
     * has no prior committed value.  
     * In otherwords, determine if this
     * is a new state value.
     * 
     * @param {*} key 
     */
    const isUncommitted = function (key) {
        _assertKey(key);
        return staged.hasOwnProperty(key) &&
            !committed.hasOwnProperty(key);
    }


    const getCommittedValue = function (key) {
        _assertKey(key);
        return committed[key];
    }

    const getCommittedKeys = function () {
        return committed.keys();
    }

    //
    // commit any staged value and 
    // return the committed value
    //
    const commitValue = function (key) {
        _assertKey(key);
        if (isStaged(key)) {
            committed[key] = staged[key];
            delete staged[key];
        }
        return committed[key];
    }

    /**
     * Commit all staged values by moving 
     * into commited values and clearing the stage.
     */
    const commit = function () {
        for (const key in staged) {
            committed[key] = staged[key];
        }
        staged = {};
    }

    const rollbackValue = function (key) {
        _assertKey(key);
        delete staged[key];
    }

    /**
     * Rollback any staged values.
     */
    const rollback = function () {
        staged = {};
    }

    /**
     * reset the committed state to the initial values
     * and clear the staged state.
     */
    const reset = function () {
        staged = {};
        committed = { ...baseState
        };
    }

    const setValue = function (key, value) {
        _assertKey(key);
        if (value !== getValue(key)) {
            staged[key] = value;
        }
    }


    /**
     * Get a value from the state;
     * - if staged, returned staged value
     * - if committed, return committed value
     * - otherwise return undefined
     * 
     * @param {*} key non-empty string
     */
    const getValue = function (key) {
        _assertKey(key);
        if (isStaged(key)) {
            return staged[key];
        }
        return committed[key];
    }

    /**
     * Return the keys of values in the state.
     * This list of keys can be used to iterate
     * all values in the state.
     * 
     *   const keys = getKeys();
     *   for(let i = 0; i < keys.length; i += 1) {
     *     const value = getValue(key);
     *   }
     */
    const getKeys = function () {
        return getCopy().keys();
    }

    /**
     * Return a shallow copy of the state
     * that includes staged and committed values.
     */
    const getCopy = function () {
        return { ...staged, ...committed };
    }

    const exports = {
        "isStaged": isStaged,
        "isCommitted": isCommitted,
        "isUncommitted": isUncommitted,
        "hasValue": hasValue,
        "setValue": setValue,
        "getValue": getValue,
        "setStagedValue": setStagedValue,
        "getStagedValue": getStagedValue,
        "getCommittedValue": getCommittedValue,
        "getStagedKeys": getStagedKeys,
        "getCommittedKeys": getCommittedKeys,
        "getKeys": getKeys,
        "commitValue": commitValue,
        "commit": commit,
        "rollbackValue": rollbackValue,
        "rollback": rollback,
        "reset": reset,
        "getCopy": getCopy,
    };

    return exports;
}
// import constrain from "./utilties.js"
// import int from "./utilities.js"
// import abs from "./utilities.js"
// import assert from "./utilities.js"


///////////// Rover Command ////////////////
function RoverCommand(host, commandSocket) {
    let running = false;
    let lastCommand = "";
    let commandCount = 0;
    let _useSpeedControl = false;
    let _minSpeed = 0;
    let _maxSpeed = 0;
    let _started = false;
    let _leftStall = 0;
    let _rightStall = 0;

    function isStarted() {
        return _started;
    }

    function start() {
        _started = true;
        window.requestAnimationFrame(_processingLoop);
        return self;
    }

    function stop() {
        _started = false;
        window.cancelAnimationFrame(_processingLoop);
        return self;
    }

    /**
     * Called periodically to process the command queue.
     * 
     * @param {*} timeStamp 
     */
    function _processingLoop(timeStamp) {
        processCommands();
        if (isStarted()) {
            window.requestAnimationFrame(_processingLoop);
        }
    }

    function isReady() {
        return commandSocket && commandSocket.isReady();
    }

    //
    // while a command is sent, but not acknowledge
    // isSending() is true and getSending() is the command
    //
    function isSending() {
        return commandSocket && commandSocket.isSending();
    }
    function getSending() {
        return commandSocket ? commandSocket.getSending() : "";
    }

    //
    // If a command is not acknowledged, then
    // hasError() is true and getError() is the error
    // message returned by the server is and 'ERROR()' frame.
    //
    function hasError() {
        return commandSocket && commandSocket.hasError();
    }
    function getError() {
        return commandSocket ? commandSocket.getError() : "";
    }


    //
    // clear the sending and error state
    // so we can send another message.
    // 
    function clear() {
        if (commandSocket) {
            commandSocket.clear();
        }
        return self;
    }

    //
    // reset the socket connection
    //
    function reset() {
        if (commandSocket) {
            commandSocket.reset();
        }
        return self;
    }

    /**
     * Clear command queue and stop rover.
     */
    function halt() {
        sendHaltCommand();
        processCommands()
    }


    /**
     * Set speed control and send it to rover.
     * 
     * @param {boolean} useSpeedControl 
     * @param {number} minSpeed 
     * @param {number} maxSpeed 
     * @param {number} Kp 
     * @param {number} Ki 
     * @param {number} Kd 
     */
    function syncSpeedControl(useSpeedControl, minSpeed, maxSpeed, Kp, Ki, Kd) {
        //
        // if we are changing control modes 
        // then we stop and clear command queue.
        //
        if(_useSpeedControl != useSpeedControl) {
            halt();
        }

        //
        // if we are using speed control, all
        // parameters must be present and valid
        //
        if(!!(_useSpeedControl = useSpeedControl)) {
            assert((typeof minSpeed == "number") && (minSpeed >= 0));
            assert((typeof maxSpeed == "number") && (maxSpeed > minSpeed));
            assert((typeof Kp == "number") && (Kp > 0) && (Kp <= 1));
            assert((typeof Ki == "number") && (Ki >= 0) && (Ki <= 1));
            assert((typeof Kd == "number") && (Kd >= 0) && (Kd <= 1));
            _minSpeed = minSpeed;
            _maxSpeed = maxSpeed;

            // tell the rover about the new speed parameters
            enqueueCommand(formatSpeedControlCommand(minSpeed, maxSpeed, Kp, Ki, Kd), true);
        } 
    }

    function formatSpeedControlCommand(minSpeed, maxSpeed, Kp, Ki, Kd) {
        return `pid(${minSpeed}, ${maxSpeed}, ${Kp}, ${Ki}, ${Kd})`;
    }

    function syncMotorStall(motorOneStall, motorTwoStall) {
        // tell the rover about the new speed parameters
        enqueueCommand(formatMotorStallCommand(
            _leftStall = motorOneStall, 
            _rightStall = motorTwoStall),
            true    // configuration is high priority command
        );
    }

    function formatMotorStallCommand(motorOneStall, motorTwoStall) {
        return `stall(${motorOneStall}, ${motorTwoStall})`;
    }

    /**
     * Send a turtle-style command to the rover.
     * 
     * @param {string} command       : 'stop', 'forward', 'reverse', 'left', 'right'
     * @param {number} speedFraction : float from 0.0 to 1.0, fraction of full throttle
     * @return {boolean}             : true if command sent, false if not
     */
    function sendTurtleCommand(
        command,        
        speedFraction)  
    {
        speedFraction = constrain(speedFraction, 0.0, 1.0);

        switch(command) {
            case 'stop': {
                return sendTankCommand(0, 0);
            }
            case 'forward': {
                return sendTankCommand(speedFraction, speedFraction);
            }
            case 'reverse': {
                return sendTankCommand(-speedFraction, -speedFraction);
            }
            case 'left': {
                return sendTankCommand(-speedFraction, speedFraction);
            }
            case 'right': {
                return sendTankCommand(speedFraction, -speedFraction);
            }
            default: {
                console.error("sendTurtleCommand got unrecognized command: " + command);
                return false;
            }
        }
    }


    /**
     * Send a joystick-style command (throttle, steering) to the rover
     * 
     * @param {number} throttleValue : float: joystick axis value -1.0 to 1.0
     * @param {number} steeringValue : float: joystick axis value -1.0 to 1.0
     * @param {boolean} throttleFlip : boolean: true to invert axis value, false to use natural axis value
     * @param {boolean} steeringFlip : boolean: true to invert axis value, false to use natural axis value
     * @param {number} throttleZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero)
     * @param {number} steeringZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero)
     * @return {boolean}             : true if command sent, false if not
     */
    function sendJoystickCommand(
        throttleValue, steeringValue,   
        throttleFlip, steeringFlip,    
        throttleZero, steeringZero)     
    {
        throttleValue = constrain(throttleValue, -1.0, 1.0);
        steeringValue = constrain(steeringValue, -1.0, 1.0);

        // apply zero area (axis zone near zero that we treat as zero)
        if(abs(throttleValue) <= throttleZero) {
            throttleValue = 0;
        }
        if(abs(steeringValue) <= steeringZero) {
            steeringValue = 0;
        }
        
        // apply flip
        if(throttleFlip) {
            throttleValue = -(throttleValue);
        }
        if(steeringFlip) {
            steeringValue = -(steeringValue);
        }

        // assume straight - not turn
        let leftValue = throttleValue;
        let rightValue = throttleValue;

        // apply steering value to slow one wheel to create a turn
        if(steeringValue >= 0) {
            // right turn - slow down right wheel
            rightValue *= 1.0 - steeringValue;
        } else {
            // left turn, slow down left wheel
            leftValue *= 1.0 + steeringValue;
        }

        // now we can use this as a tank command (we already applied flip and zero)
        return sendTankCommand(leftValue, rightValue);
    }

    /**
     * Send a tank-style (left wheel, right wheel) command to the rover.
     * 
     * @param {number} leftValue  : float: joystick axis value -1.0 to 1.0
     * @param {number} rightValue : float: joystick axis value -1.0 to 1.0
     * @param {boolean} leftFlip  : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {boolean} rightFlip : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {number} leftZero   : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @param {number} rightZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @return {boolean}          : true if command sent, false if not
     */
    function sendTankCommand(
        leftValue, rightValue,  
        leftFlip = false, rightFlip = false,    
        leftZero = 0, rightZero = 0)    
    {
        // a zero (stop) command is high priority
        const tankCommand = formatTankCommand(leftValue, rightValue, leftFlip, rightFlip, leftZero, rightZero);
        return enqueueCommand(tankCommand, (abs(leftValue) <= leftZero) && (abs(rightValue) <= rightZero));
    }

    /**
     * Send a halt command to the rover
     */
    function sendHaltCommand() {
        // clear command buffer, make halt next command
        _commandQueue = [];
        return enqueueCommand("halt()", true);
    }

    /**
     * Send a string command to the rover
     * - the command get's wrapped in a cmd() wrapper with a serial number
     * 
     * @param {string} commandString 
     * @return {boolean} true if command sent, false if not
     */
    function sendCommand(commandString)    
    {
        if(commandSocket) {
            if(commandSocket.isStarted()) {
                if(commandSocket.isReady()) {
                    if(commandSocket.hasError()) {
                        commandSocket.clearError();
                        lastCommand = "";   // clear last command sent before error so can send it again.
                    }
                    if(!commandSocket.isSending()) {
                        if(commandString == lastCommand) {
                            return true;    // no need to execute it again
                        }
                        const commandWrapper = `cmd(${commandCount}, ${commandString})`
                        if(commandSocket.sendCommand(commandWrapper)) {
                            lastCommand = commandString;
                            commandCount += 1;
                            return true;
                        }
                    }
                }
            } else {
                // restart the command socket
                commandSocket.reset();
                lastCommand = "";   // clear last command sent before error so can send it again.
            }
        }

        return false;
    }


    /**
     * Send a tank-style (left wheel, right wheel) command to the rover.
     * Wheel values (-1.0..1.0) are used to scale output values against maximums.
     * If using speed control, then values of (0..maxSpeed) are output.
     * If not using speed control, then pwm values of (0..255) are output.
     * 
     * @param {number} leftValue  : float: joystick axis value -1.0 to 1.0
     * @param {number} rightValue : float: joystick axis value -1.0 to 1.0
     * @param {boolean} leftFlip  : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {boolean} rightFlip : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {number} leftZero   : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @param {number} rightZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     */
    function formatTankCommand(
        leftValue, rightValue,  
        leftFlip = false, rightFlip = false,    
        leftZero = 0, rightZero = 0)    
    {
        leftValue = constrain(leftValue, -1.0, 1.0);
        rightValue = constrain(rightValue, -1.0, 1.0);

        // apply flip
        if(leftFlip) {
            leftValue = -(leftValue);
        }
        if(rightFlip) {
            rightValue = -(rightValue);
        }

        // 
        // scale the output value between zero-value and 1.0.
        // - output is pwm if not using speed control (0..255)
        // - output is speed if using speed control (0..maxSpeed)
        //
        let leftCommandValue = 0; 
        if(abs(leftValue) > leftZero) {
            if(_useSpeedControl) {
                leftCommandValue = map(abs(leftValue), leftZero, 1.0, 0, _maxSpeed).toFixed(4);
            } else { 
                // map axis value from stallValue to max engine value (255)
                leftCommandValue = int(map(abs(leftValue), leftZero, 1.0, int(_leftStall * 255), 255));
            }
        }
        let rightCommandValue = 0; 
        if(abs(rightValue) > rightZero) {
            if(_useSpeedControl) {
                rightCommandValue = map(abs(rightValue), rightZero, 1.0, 0, _maxSpeed).toFixed(4);
            } else {
                // map axis value from stallValue to max engine value (255)
                rightCommandValue = int(map(abs(rightValue), rightZero, 1.0, int(_rightStall * 255), 255));
            }
        }

        
        // format command
        if(_useSpeedControl) {
            return `speed(${leftCommandValue}, ${leftValue >= 0}, ${rightCommandValue}, ${rightValue >= 0})`;
        } else {
            return `pwm(${leftCommandValue}, ${leftValue >= 0}, ${rightCommandValue}, ${rightValue >= 0})`;
        }
    }

    //
    // command queue
    //
    let _commandQueue = [];
    let _highPriorityQueue = false;  // true if queue should only have high priority commands
    /**
     * Insert a command into the command queue.
     * If the command is high priority, all low
     * priority commands are removed from the 
     * queue and no low priority commands will
     * be queued until all high priority commands 
     * are sent.
     * 
     * @param {string} command : command to queue
     * @param {boolean} highPriority: the command is high priority
     * @param {boolean}        : true if command queued, 
     *                           false if not
     */
    function enqueueCommand(command, highPriority=false) {
        if(typeof command == "string") {
            // don't bother enqueueing redudant commands
            // if((0 == _commandQueue.length) 
            //     || (command != _commandQueue[_commandQueue.length - 1]))

            if(_highPriorityQueue) {
                //
                // if we have a high priority queue, 
                // don't add low priority items to it
                //
                if(!highPriority) {
                    return false; 
                }
            } else {    // !_highPriorityQueue
                // 
                // if we are switching from low priority to high priority
                // then clear the low priority commands from the queue
                //
                if(highPriority) {
                    _commandQueue = [];
                }
            }

            if(highPriority || (0 == _commandQueue.length)) {
                _commandQueue.push(command);
            } else if(!_highPriorityQueue) {
                _commandQueue[0] = command;     // only bother with latest low priority command
            }
            _highPriorityQueue = highPriority;
            return true;
        }
        return false;
    }

    /**
     * Send the next command in the command queue.
     * 
     * @returns {boolean} : true if a command was sent
     *                      false is command was not sent
     */
    function processCommands() {
        if(_commandQueue.length > 0) {
            const command = _commandQueue.shift();
            if(typeof command == "string") {
                if(sendCommand(command)) {
                    if(0 == _commandQueue.length) {
                        // we emptied the queue, so it can now take low priority items
                        _highPriorityQueue = false;
                    }
                    return true;
                }
                // put command back in queue
                _commandQueue.unshift(command)
            }
        }
        return false;
    }

    //
    /////////////// turtle command queue  /////////////////
    //
    let commands = [];
    let speeds = [];

    function enqueueTurtleCommand(command, speedPercent) {
        //
        // don't add redundant commands
        //
        if ((0 === commands.length) || (command !== commands[commands.length - 1])) {
            commands.push(command); // add to end of command buffer
            speeds.push(speedPercent / 100); // convert to 0.0 to 1.0
        } else {
            // command is already queued, no need for a second one
            console.log(`command ${command} not pushed: ${command} is already buffered.`);
        }
        processTurtleCommand(); // send next command in command queue
    }

    let lastTurtleCommand = ""

    // 
    // send the next command in the command queue
    //
    function processTurtleCommand() {
        if (0 === commands.length) {
            return; // nothing to do
        }

        const command = commands.shift();
        const speed = speeds.shift();

        if(! sendTurtleCommand(command, speed)) {
            // put command back in queue so we can try again later
            commands.unshift(command);
            speeds.unshift(speed);
        }
    }

    const self = {
        "isStarted": isStarted,
        "start": start,
        "stop": stop,
        "isReady": isReady,
        "isSending": isSending,
        "getSending": getSending,
        "hasError": hasError,
        "getError": getError,
        "reset": reset,
        "clear": clear,
        "halt": halt,
        "enqueueTurtleCommand": enqueueTurtleCommand,
        "processTurtleCommand": processTurtleCommand,
        "sendTurtleCommand": sendTurtleCommand,
        "sendJoystickCommand": sendJoystickCommand,
        "sendTankCommand": sendTankCommand,
        "sendHaltCommand": sendHaltCommand,
        "syncSpeedControl": syncSpeedControl,
        "syncMotorStall": syncMotorStall
    }

    return self;
}// import MessageBus from './message_bus.js'
// import TurtleViewController from './turtle_view_controller.js'
// import TurtleKeyboardController from './turtle_keyboard_controller.js'
// import TankViewController from './tank_view_controller.js'
// import JoystickViewController from './joystick_view_controller.js'


//
// coordinate the state of the view and the associated controllers
//
function RoverViewManager(roverCommand, messageBus, turtleViewController, turtleKeyboardControl, tankViewController, joystickViewController) {
    if (!messageBus) throw new Error();

    const FRAME_DELAY_MS = 30;

    const TURTLE_ACTIVATED = "TAB_ACTIVATED(#turtle-control)";
    const TURTLE_DEACTIVATED = "TAB_DEACTIVATED(#turtle-control)";
    const TANK_ACTIVATED = "TAB_ACTIVATED(#tank-control)";
    const TANK_DEACTIVATED = "TAB_DEACTIVATED(#tank-control)";
    const JOYSTICK_ACTIVATED = "TAB_ACTIVATED(#joystick-control)";
    const JOYSTICK_DEACTIVATED = "TAB_DEACTIVATED(#joystick-control)";

    let listening = 0;

    function startListening() {
        listening += 1;
        if (1 === listening) {
            messageBus.subscribe(TURTLE_ACTIVATED, self);
            messageBus.subscribe(TURTLE_DEACTIVATED, self);
            messageBus.subscribe(TANK_ACTIVATED, self);
            messageBus.subscribe(TANK_DEACTIVATED, self);
            messageBus.subscribe(JOYSTICK_ACTIVATED, self);
            messageBus.subscribe(JOYSTICK_DEACTIVATED, self);
        }
    }

    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            messageBus.unsubscribeAll(self);
        }
    }

    function isListening() {
        return listening > 0;
    }


    //
    // handle messages from messageBus.
    // In particular, when the TurtleView is activated
    // then start it listening and when it is deactivate
    // then stop it listening
    //
    function onMessage(message, data) {
        switch (message) {
            case TURTLE_ACTIVATED: {
                if (turtleViewController && !turtleViewController.isListening()) {
                    turtleViewController.startListening();
                }
                if (turtleKeyboardControl && !turtleKeyboardControl.isListening()) {
                    turtleKeyboardControl.startListening();
                }
                _startModeLoop(_turtleModeLoop);
                return;
            }
            case TURTLE_DEACTIVATED: {
                if (turtleViewController && turtleViewController.isListening()) {
                    turtleViewController.stopListening();
                }
                if (turtleKeyboardControl && turtleKeyboardControl.isListening()) {
                    turtleKeyboardControl.stopListening();
                }
                _stopModeLoop(_turtleModeLoop);
                return;
            }
            case TANK_ACTIVATED: {
                if (tankViewController && !tankViewController.isListening()) {
                    tankViewController.updateView(true).startListening();
                }
                _startModeLoop(_tankModeLoop);
                return;
            }
            case TANK_DEACTIVATED: {
                if (tankViewController && tankViewController.isListening()) {
                    tankViewController.stopListening();
                }
                _stopModeLoop(_tankModeLoop);
                return;
            }
            case JOYSTICK_ACTIVATED: {
                if (joystickViewController && !joystickViewController.isListening()) {
                    joystickViewController.updateView(true).startListening();
                }
                _startModeLoop(_joystickModeLoop);
                return;
            }
            case JOYSTICK_DEACTIVATED: {
                if (joystickViewController && joystickViewController.isListening()) {
                    joystickViewController.stopListening();
                }
                _stopModeLoop(_joystickModeLoop);
                return;
            }
            default: {
                console.log("TurtleViewController unhandled message: " + message);
            }

        }
    }

    let _modeLoop = null;
    function _startModeLoop(mode) {
        _stopModeLoop();
        if(!!(_modeLoop = mode)) {
            window.requestAnimationFrame(_modeLoop);
        }
        return self;
    }
    function _stopModeLoop(mode = null) {
        if(_isModeRunning(mode)) {
            window.cancelAnimationFrame(_modeLoop);
            _modeLoop = null;
        }
        return self;
    }
    function _isModeRunning(mode = null) {
        // if there is a loop running and
        // if no specific mode is specified or if specified mode is running
        return (_modeLoop && ((_modeLoop === mode) || !mode));
    }

    let _nextFrame = 0;
    function _joystickModeLoop(timeStamp) {
        if (_isModeRunning(_joystickModeLoop)) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + FRAME_DELAY_MS;    // about 10 frames per second
                if(joystickViewController) {
                    roverCommand.sendJoystickCommand(
                        joystickViewController.getAxisOneValue(),
                        joystickViewController.getAxisTwoValue(),
                        joystickViewController.getAxisOneFlip(),
                        joystickViewController.getAxisTwoFlip(),
                        joystickViewController.getAxisOneZero(),
                        joystickViewController.getAxisTwoZero()
                    );
                }
            }
            window.requestAnimationFrame(_joystickModeLoop);
        }
    }

    function _tankModeLoop(timeStamp) {
        if (_isModeRunning(_tankModeLoop)) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + FRAME_DELAY_MS;    // about 10 frames per second
                if(tankViewController) {
                    roverCommand.sendTankCommand(
                        tankViewController.getAxisOneValue(),
                        tankViewController.getAxisTwoValue(),
                        tankViewController.getAxisOneFlip(),
                        tankViewController.getAxisTwoFlip(),
                        tankViewController.getAxisOneZero(),
                        tankViewController.getAxisTwoZero()
                    );
                }
            }
            window.requestAnimationFrame(_tankModeLoop);
        }
    }

    function _turtleModeLoop(timeStamp) {
        if (_isModeRunning(_turtleModeLoop)) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + FRAME_DELAY_MS;// about 10 frames per second
                roverCommand.processTurtleCommand();    // send next command in command queue
            }
            window.requestAnimationFrame(_turtleModeLoop);
        }
    }

    const self = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "onMessage": onMessage,
    }

    return self;
}

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

///////////////// Web Socket Streaming /////////////////
function StreamingSocket(hostname, port, imageElement) {
    //
    // stream images via websocket port 81
    //
    var socket = null;

    function isReady() {
        return socket && (WebSocket.OPEN === socket.readyState);
    }

    function start() {
        socket = new WebSocket(`ws://${hostname}:${port}/stream`, ['arduino']);
        socket.binaryType = 'arraybuffer';

        try {
            socket.onopen = function () {
                console.log("StreamingSocket opened");
            }

            socket.onmessage = function (msg) {
                console.log("StreamingSocket received message");
                if("string" !== typeof msg) {
                    // convert message data to readable blob and assign to img src
                    const bytes = new Uint8Array(msg.data); // msg.data is jpeg image
                    const blob = new Blob([bytes.buffer]); // convert to readable blob
                    imageElement.src = URL.createObjectURL(blob); // assign to img source to draw it
                } else {
                    console.warn("StreamingSocket received unexpected text message: " + msg);
                }
            };

            socket.onclose = function () {
                console.log("StreamingSocket closed");
                socket = null;
            }
        } catch (exception) {
            console.log("StreamingSocket exception: " + exception);
        }
    }

    function stop() {
        if (socket) {
            if ((socket.readyState !== WebSocket.CLOSED) && (socket.readyState !== WebSocket.CLOSING)) {
                socket.close();
            }
            socket = null;
        }
    }

    const exports = {
        "start": start,
        "stop": stop,
        "isReady": isReady,
    }
    return exports;
}
//////// Rover Control UI ///////////
/**
 * Controller for tab view:
 * 
 * When a tab is clicked, it is activated and the sibling tabs are
 * deactivated.  The content associated with the selected tablink
 * element (specified as a css selector in the element's 
 * data-tabcontent attribute) is shown.  Likewise, the tabcontent 
 * of sibling tablink elements is hidden.  
 * 
 * If a messageBus is supplied to the constructor, then 'tabActivated' 
 * and 'tabDeactivated' messages are published on the bus.
 * The data for the message is the tabcontent selector specified
 * in the tablink element's data-tabcontent attribute.  
 * Your code should expect the a message will be sent for each
 * tablink element (specifically, the a tabDeactivated message will be 
 * sent even if the tab is already deactivated).  
 * You code should_not_ assume any ordering for how the tabActivated 
 * and tabDeactivate messages are sent.
 * 
 * const viewController = TabViewController(cssTabContainer, cssTabLink);
 * viewController.attachView();     // select DOM under view control
 * viewController.startListening(); // attach event handlers to DOM
 * viewController.showView();       // show the DOM
 * // View is showing
 * viewController.hideView();       // hide the DOM
 * viewController.stopListening();  // remove event handlers
 * viewController.detachView();     // clear references to DOM
 * 
 */
function TabViewController(cssTabContainer, cssTabLinks, messageBus = null) {
    let tabContainer = null;
    let tabLinks = null;
    let tabContentSelector = [];
    let tabContent = [];

    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        tabContainer = document.querySelector(cssTabContainer);
        tabLinks = tabContainer.querySelectorAll(cssTabLinks);

        // collect that tab content associated with each tab
        tabContent = [];
        tabContentSelector = [];
        for (let i = 0; i < tabLinks.length; i += 1) {
            tabContentSelector.push(tabLinks[i].dataset.tabcontent);
            tabContent.push(document.querySelector(tabContentSelector[i]))
        }

        return self;
    }

    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        tabContainer = null;
        tabLinks = null;
        tabContent = [];
        tabContentSelector = [];

        return self;
    }

    function isViewAttached() {
        return (tabContainer && tabLinks);
    }

    let showing = 0;

    function showView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        showing += 1;
        if (1 === showing) {
            show(tabContainer);
        }

        return self;
    }

    function hideView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        showing -= 1;
        if (0 === showing) {
            hide(tabContainer);
        }

        return self;
    }

    function isViewShowing() {
        return showing > 0;
    }

    let listening = 0;

    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        listening += 1;
        if (1 === listening) {
            if (tabLinks) {
                tabLinks.forEach(el => el.addEventListener("click", onTabClick));
            }
        }

        return self;
    }

    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        listening -= 1;
        if (0 === listening) {
            if (tabLinks) {
                tabLinks.forEach(el => el.removeEventListener("click", onTabClick));
            }
        }

        return self;
    }

    function isListening() {
        return listening > 0;
    }

    function activateTab(tab) {
        for (let i = 0; i < tabLinks.length; i += 1) {
            const tabLink = tabLinks[i];
            if (tab === tabLink) {
                // activate this tab's content
                tabLink.classList.add("active");
                if (tabContent[i]) {
                    show(tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_ACTIVATED(${tabContentSelector[i]})`);
                }
            } else {
                // deactivate this tab's content
                tabLink.classList.remove("active");
                if (tabContent[i]) {
                    hide(tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_DEACTIVATED(${tabContentSelector[i]})`);
                }
            }
        }

        return self;
    }

    function onTabClick(event) {
        // make this tab active and all siblings inactive
        activateTab(event.target);
    }


    const self = {
        "attachView": attachView,
        "detachView": detachView,
        "isViewAttached": isViewAttached,
        "showView": showView,
        "hideView": hideView,
        "isViewShowing": isViewShowing,
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "activateTab": activateTab,
    }
    return self;
}// import TurtleCommand from './turtle_command.js'
// import MessageBus from './message_bus.js'
// import TURTLE_SPEED_CHANGE from './turtle_view_controller.js'

//////////// ROVER TURTLE KEYBOARD INPUT /////////////
const TURTLE_KEY_DOWN = "TURTLE_KEY_DOWN";
const TURTLE_KEY_UP = "TURTLE_KEY_UP";

function TurtleKeyboardController(messageBus = null) {
    let listening = 0;

    function startListening() {
        listening += 1;
        if (1 === listening) {
            document.body.addEventListener("keydown", handleRoverKeyDown);
            document.body.addEventListener("keyup", handleRoverKeyUp);
        }
    }

    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            document.body.addEventListener("keydown", handleRoverKeyDown);
            document.body.addEventListener("keyup", handleRoverKeyUp);
        }
    }

    function isListening() {
        return listening > 0;
    }

    function handleRoverKeyDown(e) {
        e = e || window.event;

        if (e.keyCode == '38') {
            // up arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "forward");
            }
        } else if (e.keyCode == '40') {
            // down arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "reverse");
            }
        } else if (e.keyCode == '37') {
            // left arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "left");
            }
        } else if (e.keyCode == '39') {
            // right arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "right");
            }
        }
    }

    function handleRoverKeyUp(e) {
        e = e || window.event;

        if (e.keyCode == '38') {
            // up arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "forward");
            }
        } else if (e.keyCode == '40') {
            // down arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "reverse");
            }
        } else if (e.keyCode == '37') {
            // left arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "left");
            }
        } else if (e.keyCode == '39') {
            // right arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "right");
            }
        }
    }

    const self = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
    }

    return self;
}
// import TurtleCommand from './turtle_command.js'
// import MessageBus from './message_bus.js'
// import constrain from './utilities.js'
// import RollbackState from './rollback_state.js'
// import TURTLE_KEY_DOWN from './turtle_keyboard_controller.js'
// import TURTLE_KEY_UP from './turtle_keyboard_controller.js'
// import ViewStateTools from './view_state_tools.js'

///////////////// Rover Command View Controller ////////////////////
function TurtleViewController(
    roverCommand, 
    messageBus, 
    cssContainer, cssRoverButton, cssRoverSpeedInput) 
{
    const state = RollbackState({
        "speedPercent": 0.9,     // float: 0..1 normalized speed
        "speedPercentLive": 0.9, // float: 0..1 normalized speed live update
        "activeButton": "",      // string: id of active turtle button or empty string if none are active
    });

    let container = undefined;
    let turtleButtonNames = undefined;
    let turtleButtons = undefined;

    const _speedInput = RangeWidgetController(
        state, "speedPercent", "speedPercentLive", 
        1.0, 0.0, 0.01, 2, 
        cssRoverSpeedInput)

    function attachView() {
        if(isViewAttached()) throw new Error("Attempt to rebind the view.");

        container = document.querySelector(cssContainer);
        turtleButtons = Array.from(container.querySelectorAll(cssRoverButton));
        turtleButtonNames = turtleButtons.map(b => b.id.charAt(0).toUpperCase() + b.id.slice(1));
        _speedInput.attachView();
        return self;
    }

    function detachView() {
        if(isViewAttached()) {
            container = undefined;
            turtleButtons = undefined;
            turtleButtonNames = undefined;
            _speedInput.detachView();
        }
        return self;
    }

    function isViewAttached() {
        return !!turtleButtons;
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
        enforceActiveButton(force);
        _speedInput.enforceView(force);
        return self;
    }

    //
    // this is called periodically to update the controls
    // based on the state.
    //
    function updateLoop(timestamp) {
        updateView();

        if(isListening()) {
            window.requestAnimationFrame(updateLoop);
        }
    }

    //
    // reset rover command button text
    //
    function resetRoverButtons() {
        if(isViewAttached()) {
            for(let i = 0; i < turtleButtons.length; i += 1) {
                // reset button text based on button id
                const butt = turtleButtons[i];
                butt.innerHTML = turtleButtonNames[i];
                butt.classList.remove("disabled");
                butt.disabled = false;
            }
        }
        return self;
    }

    //
    // set seleced button to 'stop' state 
    // and disable other buttons
    //
    function stopRoverButton(buttonId) {
        if(isViewAttached()) {
            for(let i = 0; i < turtleButtons.length; i += 1) {
                // reset button text based on button id
                const butt = turtleButtons[i];
                if (buttonId === butt.id) {
                    butt.innerHTML = "Stop";
                    butt.classList.remove("disabled");
                    butt.disabled = false;
                } else {
                    butt.innerHTML = turtleButtonNames[i];
                    butt.classList.add("disabled");
                    butt.disabled = true;
                }
            }
        }
        return self;
    }

    /**
     * Enforce the state of the button controls.
     * 
     * @param {boolean} force true to force update of controls
     *                        false to update controls based on staged state
     */
    function enforceActiveButton(force = false) {
        if(force || state.isStaged("activeButton")) {
            const buttonId = state.commitValue("activeButton");
            if(!buttonId) {
                resetRoverButtons();
            } else {
                stopRoverButton(buttonId);
            }
        }
    }

    /////////////// listen for input ///////////////////
    let listening = 0;

    /**
     * Start listening for input.
     * This should only be called if the view is attached.
     * This can be called more then once, but each call to 
     * startListening() must be balanced with a call to stopListening().
     */
    function startListening() {
        if(!isViewAttached()) throw new Error("Attempt to start listening before view is bound.");

        listening += 1;
        if (1 === listening) {
            if(turtleButtonNames) {
                turtleButtons.forEach(el => {
                    //
                    // toggle between the button command and the stop command
                    //
                    el.addEventListener("click", onButtonClick);
                });
            }

            _speedInput.startListening();

            if(messageBus) {
                messageBus.subscribe(TURTLE_KEY_DOWN, self);
                messageBus.subscribe(TURTLE_KEY_UP, self);
            }
        }

        window.requestAnimationFrame(updateLoop);
        return self;
    }

    /**
     * Start listening for input.
     * This should only be called if the view is attached.
     * This can be called more then once, but each call to 
     * stopListening() must balance with a call to startListening().
     */
    function stopListening() {
        if(!isViewAttached()) throw new Error("Attempt to stop listening to unbound view.");

        listening -= 1;
        if (0 === listening) {
            if(turtleButtons) {
                turtleButtons.forEach(el => {
                    //
                    // toggle between the button command and the stop command
                    //
                    el.removeEventListener("click", onButtonClick);
                });
            }

            _speedInput.stopListening();

            if(messageBus) {
                messageBus.unsubscribeAll(self);
            }

            window.cancelAnimationFrame(updateLoop);
        }
        return self;
    }

    function isListening() {
        return listening > 0;
    }

    function onMessage(message, data) {
        switch (message) {
            case TURTLE_KEY_DOWN: {
                onButtonSelected(data);
                return;
            }
            case TURTLE_KEY_UP: {
                onButtonUnselected(data);
                return;
            }
            default: {
                console.log("Unhandled message in TurtleViewController");
            }
        }
    }


    //
    // attach rover command buttons
    //
    function onButtonClick(event) {
        const buttonId = event.target.id;
        if (buttonId === state.getValue("activeButton")) {
            onButtonUnselected(buttonId);
        } else {
            onButtonSelected(buttonId);
        }
    };
    function onButtonSelected(buttonId) {
        //
        // if it is the active button,  
        // then revert the button and send 'stop' command
        // if it is not the active button, 
        // then make it active and send it's command
        //
        state.setValue("activeButton", buttonId);
        roverCommand.enqueueTurtleCommand(buttonId, int(100 * state.getValue("speedPercent"))); // run button command
    };
    function onButtonUnselected(buttonId) {
        state.setValue("activeButton", "");
        roverCommand.enqueueTurtleCommand("stop", 0); // run stop command
    }

    const self = {
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
    }
    return self;
}
// import RollbackState from "./rollback_state.js"
// import ViewValidationTools from "./view_validation_tools.js"

const ViewStateTools = function() {

    /**
     * Validate numeric value and update state.
     * 
     * @param {RollbackState} rollbackState // OUT: get's updated rollbackState.get(key) value
     * @param {string} key                  // IN : property name to update in rollbackState
     * @param {string} keyValid             // IN : if defined, name of boolean property in rollbackState
     *                                      //      that tracks if the state value is valid.
     * @param {number} value                // IN : updated value to validate and set if valid
     * @param {number} minValue             // IN : if defined, this is minimum allowed value inclusive
     * @param {number} maxValue             // IN : if defined, this is maximum allowed value inclusive
     * @returns {boolean}                   // RET: true if new valid is valid, false if invalid
     */
    function updateNumericState(
        rollbackState, key, keyValid, 
        value,                  // IN : new value for state
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
    {
        const numericValue = ViewValidationTools.validateNumericInput(value, minValue, maxValue);
        if(typeof numericValue == "number") {
            // valid number within range
            rollbackState.setValue(key, numericValue);
            if(!!keyValid) rollbackState.setValue(keyValid, true);
            return true;
        } else {
            if(!!keyValid) rollbackState.setValue(keyValid, false);    // show as invalid
            return false;
        }
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {object} rollbackState 
     * @param {string} propertyName 
     * @param {Element} selectElement 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceSelectMenu(rollbackState, propertyName, selectElement, force = false) {
        //
        // enforce the select menu's value
        //
        if (force || rollbackState.isStaged(propertyName)) {
            if (selectElement) {
                selectElement.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }

        return false;
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {object} rollbackState 
     * @param {string} propertyName 
     * @param {Element} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceText(rollbackState, propertyName, element, force = false) {
        //
        // enforce the text element's value
        //
        if (force || rollbackState.isStaged(propertyName)) {
            if (element) {
                element.textContent = rollbackState.commitValue(propertyName);
                return true;
            }
        }

        return false;
    }

    /**
     * Enforce state change to input element.
     * 
     * @param {object} rollbackState 
     * @param {string} propertyName 
     * @param {Element} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceInput(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {object} rollbackState 
     * @param {string} propertyName 
     * @param {Element} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceCheck(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.checked = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    /**
     * Enforce the "invalid" class name on an element.
     * 
     * @param {object} rollbackState 
     * @param {string} propertyName name of boolean state property 
     *                              with value of true is valid, false is invalid
     * @param {Element} element element that gets 'invalid' class name 
     * @param {boolean} force optional; defaults to false
     *                        - true to force committing state,
     *                        - false to commit state only if it changed 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceValid(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                const valid = rollbackState.commitValue(propertyName);
                if(valid) {
                    element.classList.remove("invalid");
                } else {
                    element.classList.add("invalid");
                }
                return true;
            }
        }
        return false;
    }

        //
    // enforce a range control's value
    // based in the view state.
    //
    /**
     * Enforce stage change in range control's value. 
     * 
     * @param {object} rollbackState 
     * @param {string} propertyName 
     * @param {Element} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceRange(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    const exports = {
        "enforceSelectMenu": enforceSelectMenu,
        "enforceText": enforceText,
        "enforceInput": enforceInput,
        "enforceCheck": enforceCheck,
        "enforceValid": enforceValid,
        "enforceRange": enforceRange,
        "updateNumericState": updateNumericState,
    }
    return exports;
}();

const ViewValidationTools = function() {
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

    const exports = {
        "validateNumericInput": validateNumericInput,
    }

    return exports;
}();
const ViewWidgetTools = function() {
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
    function onRangeIncrement(state, parameter, parameterLive, increment, maxRange, decimals) {
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
    function onRangeDecrement(state, parameter, parameterLive, increment, minRange, decimals) {
        // update state to cause a redraw on game loop
        let value = state.getValue(parameter);
        if((typeof value == "number") && (value >= (minRange + increment)))
        {
            value = constrain(parseFloat((value - increment).toFixed(decimals)), 0, 1);
            state.setValue(parameter, value);
            state.setValue(parameterLive, value);
        }
    }

    /**
     * Clear all the select menu options.
     * 
     * @param {Element} select 
     */
    function clearSelectOptions(select) {
        if (select) {
            while (select.options.length > 0) {
                select.remove(0);
            }
        }
    }



    const exports = {
        "onRangeIncrement": onRangeIncrement,
        "onRangeDecrement": onRangeDecrement,
        "clearSelectOptions": clearSelectOptions,
    };

    return exports;
}();// import SpeedViewController from './speed_view_controller.js'

///////////////// main //////////////////
document.addEventListener('DOMContentLoaded', function (event) {
    var baseHost = document.location.origin

    // 
    // update the element's value
    // and optionally send the change
    // to the server (default is true)
    //
    const updateValue = (el, value, updateRemote) => {
        updateRemote = updateRemote == null ? true : updateRemote
        let initialValue
        if (el.type === 'checkbox') {
            initialValue = el.checked
            value = !!value
            el.checked = value
        } else {
            initialValue = el.value
            el.value = value
        }

        if (updateRemote && initialValue !== value) {
            updateConfig(el);
        } else if (!updateRemote) {
            if (el.id === "aec") {
                value ? hide(exposure) : show(exposure)
            } else if (el.id === "agc") {
                if (value) {
                    show(gainCeiling)
                    hide(agcGain)
                } else {
                    hide(gainCeiling)
                    show(agcGain)
                }
            } else if (el.id === "awb_gain") {
                value ? show(wb) : hide(wb)
            }
        }
    }

    //
    // update the element's corresponding
    // config on the remote server
    //
    function updateConfig(el) {
        let value
        switch (el.type) {
            case 'checkbox':
                value = el.checked ? 1 : 0
                break
            case 'range':
            case 'select-one':
                value = el.value
                break
            case 'button':
            case 'submit':
                value = '1'
                break
            default:
                return
        }

        const query = `${baseHost}/control?var=${el.id}&val=${value}`

        fetch(query)
            .then(response => {
                console.log(`request to ${query} finished, status: ${response.status}`)
            })
    }

    //
    // Add a handler to all close buttons
    // which 'closes' the parent element 
    // when clicked.
    //
    document
        .querySelectorAll('.close')
        .forEach(el => {
            el.onclick = () => {
                hide(el.parentNode)
            }
        })

    // 
    // call the /status endpoint to read all 
    // initial camera values as json
    // and update each value locally.
    // Delay 2 seconds to give camera time to start.
    //
    setTimeout(() => {
        fetch(`${baseHost}/status`)
            .then(function (response) {
                return response.json()
            })
            .then(function (state) {
                document
                    .querySelectorAll('.default-action')
                    .forEach(el => {
                        updateValue(el, state[el.id], false)
                    })
            })
    }, 2000);

    const view = document.getElementById('stream')
    const viewContainer = document.getElementById('stream-container')
    const stillButton = document.getElementById('get-still')
    const streamButton = document.getElementById('toggle-stream')
    const closeButton = document.getElementById('close-stream')

    //
    // create instances of the control modules
    //
    const messageBus = MessageBus();

    const streamingSocket = StreamingSocket(location.hostname, 81, view);
    const commandSocket = CommandSocket(location.hostname, 82);
    const roverCommand = RoverCommand(baseHost, commandSocket);

    const gamePadListener = GamepadListener(messageBus);

    const joystickContainer = document.getElementById("joystick-control");
    const joystickViewController = GamePadViewController(joystickContainer, 
        "#joystick-control > .selector > .select-gamepad ",                                                                     // gamepad select element
        "#joystick-control > .selector > .axis-one", "#joystick-control > .selector > .axis-two",                                   // axis select element
        "#joystick-control > .axis-one-value > .control-value", "#joystick-control > .axis-two-value > .control-value",             // axis value element
        "#joystick-control > .axis-one-zero",   // axis zero range widget
        "#joystick-control > .axis-two-zero",   // axis zero range widget
        "#joystick-control > .axis-one-flip > .switch > input[type=checkbox]", "#joystick-control > .axis-two-flip > .switch > input[type=checkbox]",   // axis flip checkbox element
        messageBus);

    const tankContainer = document.getElementById("tank-control");
    const tankViewController = GamePadViewController(tankContainer, 
        "#tank-control > .selector > .select-gamepad ",                                                                     // gamepad select element
        "#tank-control > .selector > .axis-one", "#tank-control > .selector > .axis-two",                                   // axis select element
        "#tank-control > .axis-one-value > .control-value", "#tank-control > .axis-two-value > .control-value",             // axis value element
        "#tank-control > .axis-one-zero", "#tank-control > .axis-two-zero",         
        "#tank-control > .axis-one-flip > .switch > input[type=checkbox]", "#tank-control > .axis-two-flip > .switch > input[type=checkbox]",   // axis flip checkbox element
        messageBus);

    const motorViewController = MotorViewController( 
        roverCommand,
        "#motor-values",
        "#motor-values .motor-one-stall",
        "#motor-values .motor-two-stall",
    );

    const speedViewController = SpeedViewController(
        roverCommand,
        "#pid-values",
        "#use_speed_control",
        "#min_speed",
        "#max_speed",
        "#proportional_gain",
        "#integral_gain",
        "#derivative_gain",
    );

    //const roverTurtleCommander = TurtleCommand(baseHost);
    const turtleKeyboardControl = TurtleKeyboardController(messageBus);
    const turtleViewController = TurtleViewController(roverCommand, messageBus, '#turtle-control', 'button.rover', '#rover_speed-group');

    const roverViewManager = RoverViewManager(roverCommand, messageBus, turtleViewController, turtleKeyboardControl, tankViewController, joystickViewController);
    const roverTabController = TabViewController("#rover-control", ".tablinks", messageBus);

    const configTabController = TabViewController("#configuration-tabs", ".tablinks", messageBus);

    //
    // start the turtle rover control system
    //
    commandSocket.start();  // start socket for sending commands
    roverCommand.start();   // start processing rover commands

    // start listening for input
    turtleViewController.attachView().updateView(true).startListening();
    turtleKeyboardControl.startListening();
    tankViewController.attachView();
    joystickViewController.attachView();
    roverTabController.attachView().startListening();
    roverViewManager.startListening();
    motorViewController.attachView().updateView(true).showView().startListening();
    speedViewController.attachView().updateView(true).hideView().startListening();
    configTabController.attachView().startListening();

    const stopStream = () => {
        streamingSocket.stop();
        view.onload = null;
        streamButton.innerHTML = 'Start Stream'
    }

    let startTimestamp = 0;
    let frameCount = 0;
    const startStream = () => {
        // websocket listener will start showing frames
        streamingSocket.start();
        show(viewContainer)
        streamButton.innerHTML = 'Stop Stream'
    }

    // Attach actions to buttons
    stillButton.onclick = () => {
        stopStream()
        view.src = `${baseHost}/capture?_cb=${Date.now()}`
        show(viewContainer)
    }

    closeButton.onclick = () => {
        stopStream()
        hide(viewContainer)
    }

    streamButton.onclick = () => {
        const streamEnabled = streamButton.innerHTML === 'Stop Stream'
        if (streamEnabled) {
            stopStream()
        } else {
            startStream()
        }
    }


    //
    // make sure select and range controls don't
    // respond to keyboard keys because
    // it conflicts with the rover control
    //
    document.querySelectorAll('input[type=range]').forEach(el => {
        el.onkeydown = (event) => {
            event.preventDefault()
        }
    });
    document.querySelectorAll('select').forEach(el => {
        el.onkeydown = (event) => {
            event.preventDefault()
        }
    });

    // Attach default on change action
    document
        .querySelectorAll('.default-action')
        .forEach(el => {
            el.onchange = () => updateConfig(el)
        })

    // Custom actions
    // Gain
    const agc = document.getElementById('agc')
    const agcGain = document.getElementById('agc_gain-group')
    const gainCeiling = document.getElementById('gainceiling-group')
    agc.onchange = () => {
        updateConfig(agc)
        if (agc.checked) {
            show(gainCeiling)
            hide(agcGain)
        } else {
            hide(gainCeiling)
            show(agcGain)
        }
    }

    // Exposure
    const aec = document.getElementById('aec')
    const exposure = document.getElementById('aec_value-group')
    aec.onchange = () => {
        updateConfig(aec)
        aec.checked ? hide(exposure) : show(exposure)
    }

    // AWB
    const awb = document.getElementById('awb_gain')
    const wb = document.getElementById('wb_mode-group')
    awb.onchange = () => {
        updateConfig(awb)
        awb.checked ? show(wb) : hide(wb)
    }

    const framesize = document.getElementById('framesize')

    framesize.onchange = () => {
        updateConfig(framesize)
    }
})
