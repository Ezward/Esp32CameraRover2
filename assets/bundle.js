//////////// bundle.js //////////////


///////////////// Web Socket for Rover Commands /////////////////
function CommandSocket(hostname, port=82) {
    //
    // stream images via websocket port 81
    //
    var socket = null;

    function isReady() {
        return socket && (WebSocket.OPEN === socket.readyState);
    }

    function sendCommand(textCommand) {
        if(!isReady()) return false;
        if(!textCommand) return false;

        try {
            console.log("CommandSocket.send: " + textCommand);
            socket.send(textCommand);
            return true;
        } 
        catch(error) {
            console.log("CommandSocket error: " + error);
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
                console.log("CommandSocket received message");
                if("string" === typeof msg) {
                    console.log(msg);
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
        "isReady": isReady,
        "sendCommand": sendCommand,
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
** constrain a value to a range.
** if the value is < min, then it becomes the min.
** if the value > max, then it becomes the max.
** otherwise it is unchanged.
*/
function constrain(value, min, max) {
    if (typeof value !== "number") throw new ValueError();
    if (typeof min !== "number") throw new ValueError();
    if (typeof max !== "number") throw new ValueError();
    if (min > max) throw new ValueError();

    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/*
** map a value in one range to another range
*/
function map(value, fromMin, fromMax, toMin, toMax) {
    if (typeof value !== "number") throw new ValueError();
    if (typeof fromMin !== "number") throw new ValueError();
    if (typeof fromMax !== "number") throw new ValueError();
    if (typeof toMin !== "number") throw new ValueError();
    if (typeof toMax !== "number") throw new ValueError();

    const fromRange = fromMax - fromMin;
    const toRange = toMax - toMin;
    return (value - fromMin) * toRange / fromRange + toMin
}

/*
** create a new list by keeping all elements in the original list
** that return true when passed to the given filterFunction
** and discarding all other elements.
*/
function filterList(list, filterFunction) {
    var elements = [];

    // Loop through each element, apply filter and push to the array
    if (filterFunction) {
        for (let i = 0; i < list.length; i += 1) {
            const element = list[i];
            if (filterFunction(element)) {
                elements.push(sibling);
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
        if (typeof buttonValue !== "number") throw new ValueError();
        if (typeof start !== "number") throw new ValueError();
        if (typeof end !== "number") throw new ValueError();

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
        if (typeof axisValue !== "number") throw new ValueError();
        if (typeof start !== "number") throw new ValueError();
        if (typeof end !== "number") throw new ValueError();

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
 */
function GamePadViewController(
    container,
    cssSelectGamePad,
    cssSelectAxisOne,
    cssSelectAxisTwo,
    cssAxisOneValue,
    cssAxisTwoValue,
    messageBus) {
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
        gamePadNames: [], // [string]: array of connected controller names 
        //           or empty array if no controller is connected
        gamePadIndices: [], // [integer]: array of integer where each integer is an index into navigator.getGamePads()
        //            or empty array if no gamepad is connected.
        gamePadAxes: [], // [integer]: array integer with axis count for each gamepad
        selected: -1, // integer: index of selected gamepad into gamePadNames, gamePadIndices and gamePadAxes

        //
        // throttle and steering axis menu state
        //
        axisCount: 0, // integer: number of axes on selected gamepad
        axisOne: 0, // integer: index of axis for controlling throttle
        axisOneValue: 0.0, // float: value -1.0 to 1.0 for throttle axis
        axisTwo: 0, // integer: index of axis for controlling steering
        axisTwoValue: 0.0, // float: value -1.0 to 1.0 for steering axis
    });


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

    function getAxisTwo() {
        return _gamePadState.getValue("axisTwo");
    }

    function getAxisTwoValue() {
        return _gamePadState.getValue("axisTwoValue");
    }

    let gamePadSelect = undefined;
    let axisOneSelect = undefined;
    let axisTwoSelect = undefined;
    let axisOneText = undefined;
    let axisTwoText = undefined;

    function attachView() {
        if (!gamePadSelect) {
            gamePadSelect = container.querySelector(cssSelectGamePad);
            axisOneSelect = container.querySelector(cssSelectAxisOne);
            axisTwoSelect = container.querySelector(cssSelectAxisTwo);
            axisOneText = container.querySelector(cssAxisOneValue);
            axisTwoText = container.querySelector(cssAxisTwoValue);
        }
    }

    function detachView() {
        if (listening) throw new Error("Attempt to detachView while still listening");
        if (!!gamePadSelect) {
            gamePadSelect = undefined;
            axisOneSelect = undefined;
            axisTwoSelect = undefined;
            axisOneText = undefined;
            axisTwoText = undefined;
        }
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

        }

        if(_listening) {
            const now = new Date();
            _gameloop(now.getTime());
        }
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

            window.cancelAnimationFrame(_gameloop);
        }
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
    }

    function hideView() {
        showing -= 1;
        if (0 === showing) {
            hide(container);
        }
    }

    function isViewShowing() {
        return showing > 0;
    }

    function updateView() {
        _updateConnectedGamePads();
        _updateGamePadValues();
        _enforceGamePadView();
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
    }

    function _enforceGamePadView() {
        //
        // if we have a staged value, then
        // we need to update that ui element
        //
        _enforceGamePadMenu(gamePadSelect);
        _enforceGamePadSelection(gamePadSelect);

        //
        // if available axes have changed, then recreate options menus
        //
        const enforced = _enforceAxisOptions(axisOneSelect, "axisOne");
        _enforceAxisSelection(axisOneSelect, "axisOne");
        _enforceText(axisOneText, "axisOneValue");

        _enforceAxisOptions(axisTwoSelect, "axisTwo", enforced);
        _enforceAxisSelection(axisTwoSelect, "axisTwo");
        _enforceText(axisTwoText, "axisTwoValue");
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

    /**
     * Enforce the select menu's value if it has changed.
     * 
     * @param {*} cssSelector 
     * @param string selectValue: "axisTwo" or "axisOne"
     * @param {*} force 
     * @returns true if enforced, false if not
     */
    function _enforceAxisSelection(selectElement, selectValue, force = false) {
        //
        // enforce the select menu's value
        //
        if (force || _gamePadState.isStaged(selectValue)) {
            if (selectElement) {
                selectElement.value = _gamePadState.commitValue(selectValue);
                return true;
            }
        }

        return false;
    }

    function _enforceText(element, key, force = false) {
        //
        // enforce the select menu's value
        //
        if (force || _gamePadState.isStaged(key)) {
            if (element) {
                element.textContent = _gamePadState.commitValue(key);
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

    /**
     * Clear all the select menu options.
     * 
     * @param {*} select 
     */
    function _clearOptions(select) {
        if (select) {
            while (select.options.length > 0) {
                select.remove(0);
            }
        }
    }

    function _assert(test) {
        if (!test) {
            throw new ValueError();
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
        "getAxisTwo": getAxisTwo,
        "getAxisTwoValue": getAxisTwoValue,
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
            throw ValueError()
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
// import MessageBus from './message_bus.js'
// import TurtleViewController from './turtle_view_controller.js'
// import TurtleKeyboardController from './turtle_keyboard_controller.js'
// import TankViewController from './tank_view_controller.js'
// import JoystickViewController from './joystick_view_controller.js'


//
// coordinate the state of the view and the associated controllers
//
function RoverViewManager(messageBus, turtleViewController, turtleKeyboardControl, tankViewController, joystickViewController) {
    if (!messageBus) throw new ValueError();

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
                return;
            }
            case TURTLE_DEACTIVATED: {
                if (turtleViewController && turtleViewController.isListening()) {
                    turtleViewController.stopListening();
                }
                if (turtleKeyboardControl && turtleKeyboardControl.isListening()) {
                    turtleKeyboardControl.stopListening();
                }
                return;
            }
            case TANK_ACTIVATED: {
                if (tankViewController && !tankViewController.isListening()) {
                    tankViewController.startListening()
                    tankViewController.updateView();
                }
                return;
            }
            case TANK_DEACTIVATED: {
                if (tankViewController && tankViewController.isListening()) {
                    tankViewController.stopListening();
                }
                return;
            }
            case JOYSTICK_ACTIVATED: {
                if (joystickViewController && !joystickViewController.isListening()) {
                    joystickViewController.startListening();
                    joystickViewController.updateView();
                }
                return;
            }
            case JOYSTICK_DEACTIVATED: {
                if (joystickViewController && joystickViewController.isListening()) {
                    joystickViewController.stopListening();
                }
                return;
            }
            default: {
                console.log("TurtleViewController unhandled message: " + message);
            }

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
            return;
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
    }

    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return;
        }

        tabContainer = null;
        tabLinks = null;
        tabContent = [];
        tabContentSelector = [];
    }

    function isViewAttached() {
        return (tabContainer && tabLinks);
    }

    let showing = 0;

    function showView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return;
        }

        showing += 1;
        if (1 === showing) {
            show(tabContainer);
        }
    }

    function hideView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return;
        }

        showing -= 1;
        if (0 === showing) {
            hide(tabContainer);
        }
    }

    function isViewShowing() {
        return showing > 0;
    }

    let listening = 0;

    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return;
        }

        listening += 1;
        if (1 === listening) {
            if (tabLinks) {
                tabLinks.forEach(el => el.addEventListener("click", onTabClick));
            }
        }
    }

    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return;
        }

        listening -= 1;
        if (0 === listening) {
            if (tabLinks) {
                tabLinks.forEach(el => el.removeEventListener("click", onTabClick));
            }
        }
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
    }

    function onTabClick(event) {
        // make this tab active and all siblings inactive
        activateTab(event.target);
    }


    const exports = {
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
    return exports;
}

///////////// Tank Command ////////////////
function TankCommand(commandSocket, gamepadViewController) {
    let running = false;
    let lastCommand = "";


    function isRunning() {
        return running;
    }

    function start() {
        if(!running) {
            running = true;

            // start the command loop
            _gameloop(performance.now());
        }
    }

    function stop() {
        if(running) {
            running = false;
            window.cancelAnimationFrame(_gameloop);
        }
    }

    function abs(x) {
        if("number" !== typeof x) throw new TypeError();
        return (x >= 0) ? x : -x;
    }
    function int(x) {
        if("number" !== typeof x) throw new TypeError();
        return x | 0;
    }

    const _timeSpanPerFrame = 90;  // about 10 fps
    let _lastTimeStamp = 0;
    function _gameloop(timeStamp) {
        if (running) {
            // frame rate limit so we don't overload the ESP32 with requests
            const timeSpan = timeStamp - _lastTimeStamp;
            if(timeSpan >= _timeSpanPerFrame) {
                _lastTimeStamp = timeStamp;
                if(gamepadViewController) {
                    const leftValue = gamepadViewController.getAxisOneValue();
                    const rightValue = gamepadViewController.getAxisTwoValue();
                    const tankCommand = `tank(${int(abs(leftValue) * 255)}, ${leftValue >= 0}, ${int(abs(rightValue) * 255)}, ${rightValue >= 0})`
                    
                    //
                    // if this is a new command then send it
                    //
                    if(tankCommand !== lastCommand) {
                        if(commandSocket && commandSocket.isReady()) {
                            if(commandSocket.sendCommand(tankCommand)) {
                                lastCommand = tankCommand;
                            }
                        }
                    }
                }
            }
            window.requestAnimationFrame(_gameloop);
        }
    }

    const exports = {
        "start": start,
        "stop": stop,
        "isRunning": isRunning,
    }

    return exports;
}

///////////////// ROVER COMMAND API ////////////////////
function TurtleCommand(host) {
    let roverSending = false;
    let roverDirection = "stop";
    let roverSpeed = 0;

    //
    // append a command to the command queue
    //
    let commands = [];
    let speeds = [];

    function roverPostCommand(command, speedPercent) {
        //
        // don't add redundant commands
        //
        if ((0 === commands.length) || (command !== commands[commands.length - 1])) {
            commands.push(command); // add to end of command buffer
            speeds.push(0 | ((speedPercent * 255) / 100)); // convert to int 0..255
        } else {
            // command is already queued, no need for a second one
            console.log(`command ${command} not pushed: ${command} is already buffered.`);
        }
        roverSendCommand(); // send next command in command queue
    }


    // 
    // send the next command in the command queue
    //
    function roverSendCommand() {
        if (0 === commands.length) {
            return; // nothing to do
        }
        if (roverSending) {
            return; // already busy, leave command buffered
        }
        let command = commands[0];
        let speed = speeds[0];
        if (roverDirection === command) {
            commands.shift(); // remove the redundant command
            speeds.shift();
            console.log(`command ${command} ignored: rover already is ${command}.`);
            return;
        }

        roverSendCommandImmediate(command, speed);
    }

    function roverSendCommandImmediate(command, speed) {
        console.log(`sending ${command}, speed ${speed}`);
        roverSending = command;
        let url = `${host}/rover?direction=${command}&speed=${speed}`;
        fetch(url).then((response) => {
            if (200 == response.status) {
                console.log(`${command} fulfilled`);

                // remove command from buffer and make sure we sent the right one
                const sentCommand = commands.shift();
                const sentSpeed = speeds.shift();
                console.assert("The executed command should be at the start of the buffer.", command === sentCommand);
                console.assert("The executed speed should be at the start of the buffer.", speed === sentSpeed);

                // this is what we are doing folks
                roverDirection = command;
                roverSpeed = speed;
            } else {
                console.log(`${command} rejected: ${response.statusText}`);
                stop();
            }
        }, (reason) => {
            console.log(`${command} failed: ${reason}`);
            stop();
        }).catch((reason) => {
            console.log(`${command} exception: ${reason}`);
            stop();
        }).finally((info) => {
            console.log(`done sending command ${command}`);
            roverSending = null
        })
    }


    let running = false;

    function roverLoop(timestamp) {
        if (running) {
            roverSendCommand();
            window.requestAnimationFrame(roverLoop);
        }
    }

    function start() {
        running = true;
        window.requestAnimationFrame(roverLoop);
    }

    function stop() {
        if (running) {
            running = false;
            commands = [];
            speeds = [];
            window.cancelAnimationFrame(roverLoop);
            roverSendCommandImmediate("stop", 0);
        }
    }

    const exports = {
        "start": start,
        "stop": stop,
        "roverPostCommand": roverPostCommand,
    }

    return exports;
}
// import TurtleCommand from './turtle_command.js'
// import MessageBus from './message_bus.js'

//////////// ROVER TURTLE KEYBOARD INPUT /////////////
function TurtleKeyboardController(turtleCommander, messageBus = null) {
    let listening = 0;
    let speedPercent = 100;
    let turtleViewController = undefined;

    // inject view controller dependency
    function setViewController(viewController) {
        turtleViewController = viewController;
    }

    function setSpeedPercent(percent) {
        speedPercent = constrain(percent, 0, 100);
    }

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
            turtleCommander.roverPostCommand("forward", speedPercent);
            if (turtleViewController) {
                turtleViewController.stopRoverButton("forward"); // button becomes stop button
            }
        } else if (e.keyCode == '40') {
            // down arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("reverse", speedPercent);
            if (turtleViewController) {
                turtleViewController.stopRoverButton("reverse"); // button becomes stop button
            }
        } else if (e.keyCode == '37') {
            // left arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("left", speedPercent);
            if (turtleViewController) {
                turtleViewController.stopRoverButton("left"); // button becomes stop button
            }
        } else if (e.keyCode == '39') {
            // right arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("right", speedPercent);
            if (turtleViewController) {
                turtleViewController.stopRoverButton("right"); // button becomes stop button
            }
        }
    }

    function handleRoverKeyUp(e) {
        e = e || window.event;

        if (e.keyCode == '38') {
            // up arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("stop", 0)
            if (turtleViewController) {
                turtleViewController.resetRoverButtons(); // button reverts to command
            }
        } else if (e.keyCode == '40') {
            // down arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("stop", 0)
            if (turtleViewController) {
                turtleViewController.resetRoverButtons(); // button reverts to command
            }
        } else if (e.keyCode == '37') {
            // left arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("stop", 0)
            if (turtleViewController) {
                turtleViewController.resetRoverButtons(); // button reverts to command
            }
        } else if (e.keyCode == '39') {
            // right arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("stop", 0)
            if (turtleViewController) {
                turtleViewController.resetRoverButtons(); // button reverts to command
            }
        }
    }

    const exports = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "setSpeedPercent": setSpeedPercent,
        "setViewController": setViewController,
    }

    return exports;
}
// import TurtleCommand from './turtle_command.js'
// import MessageBus from './message_bus.js'

///////////////// Rover Command View Controller ////////////////////
function TurtleViewController(turtleCommander, setSpeedPercent, cssRoverButton, cssRoverSpeedInput, messageBus = null) {
    const self = this;
    let speedPercent = 0;

    function turtleButtons() {
        return document.querySelectorAll(cssRoverButton);
    }

    function roverSpeedInput() {
        return document.querySelector(cssRoverSpeedInput);
    }

    //
    // reset rover command button text
    //
    function resetRoverButtons() {
        turtleButtons().forEach(butt => {
            // reset button text based on button id
            butt.innerHTML = butt.id.charAt(0).toUpperCase() + butt.id.slice(1);
            butt.classList.remove("disabled");
            butt.disabled = false;
        })
    }

    function stopRoverButton(buttonId) {
        turtleButtons().forEach(butt => {
            // reset button text based on button id
            if (buttonId === butt.id) {
                butt.innerHTML = "Stop";
                butt.classList.remove("disabled");
                butt.disabled = false;
            } else {
                butt.innerHTML = butt.id.charAt(0).toUpperCase() + butt.id.slice(1);
                butt.classList.add("disabled");
                butt.disabled = true;
            }
        })
    }

    //
    // attach rover command buttons
    //
    function onButtonClick(event) {
        const el = event.target;
        if ("Stop" == el.innerHTML) {
            resetRoverButtons(); // button reverts to command
            turtleCommander.roverPostCommand("stop", 0); // run stop command
        } else {
            stopRoverButton(el.id); // button becomes stop button
            turtleCommander.roverPostCommand(el.id, speedPercent); // run button command
        }
    };

    function onSpeedChange(event) {
        speedPercent = constrain(parseInt(event.target.value), 0, 100);
        if (typeof setSpeedPercent === "function") {
            setSpeedPercent(speedPercent); // tell keyboard system about speed
        }
        console.log(`speed percent = ${speedPercent}`);
    }

    let listening = false;

    function startListening() {
        listening += 1;
        if (1 === listening) {
            turtleButtons().forEach(el => {
                //
                // toggle between the button command and the stop command
                //
                el.addEventListener("click", onButtonClick);
            });

            const speedInput = roverSpeedInput();
            if (speedInput) {
                speedInput.addEventListener("change", onSpeedChange);
            }
        }
    }

    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            turtleButtons().forEach(el => {
                //
                // toggle between the button command and the stop command
                //
                el.removeEventListener("click", onButtonClick);
            });

            const speedInput = roverSpeedInput();
            if (speedInput) {
                speedInput.removeEventListener("change", onSpeedChange);
            }
        }
    }

    function isListening() {
        return listening > 0;
    }

    const exports = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "resetRoverButtons": resetRoverButtons,
        "stopRoverButton": stopRoverButton,
    }
    return exports;
}
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

    const gamePadListener = GamepadListener(messageBus);

    const joystickContainer = document.getElementById("joystick-control");
    const joystickViewController = GamePadViewController(joystickContainer, "select.gamepad", "select.throttle", "select.steering", "span.throttle", "span.steering", messageBus);

    const tankContainer = document.getElementById("tank-control");
    const tankViewController = GamePadViewController(tankContainer, "select.tank-gamepad", "select.tank-left", "select.tank-right", "span.tank-left", "span.tank-right", messageBus);
    const roverTankCommand = TankCommand(commandSocket, tankViewController);

    const roverTurtleCommander = TurtleCommand(baseHost);
    const turtleKeyboardControl = TurtleKeyboardController(roverTurtleCommander);
    const turtleViewController = TurtleViewController(roverTurtleCommander, turtleKeyboardControl.setSpeedPercent, 'button.rover', '#rover_speed');
    turtleKeyboardControl.setViewController(turtleViewController);

    const roverViewManager = RoverViewManager(messageBus, turtleViewController, turtleKeyboardControl, tankViewController, joystickViewController);
    const roverTabController = TabViewController("#rover-control", ".tablinks", messageBus);


    //
    // start the turtle rover control system
    //
    roverTurtleCommander.start(); // start processing rover commands
    roverTankCommand.start();
    commandSocket.start();

    // start listening for input
    turtleViewController.startListening();
    turtleKeyboardControl.startListening();
    tankViewController.attachView();
    // tankViewController.startListening();
    joystickViewController.attachView();
    // joystickViewController.startListening();
    roverTabController.attachView();
    roverTabController.startListening();
    roverViewManager.startListening();

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
