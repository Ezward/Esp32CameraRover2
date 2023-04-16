
// global constants
const LEFT_WHEEL = "left";
const RIGHT_WHEEL = "right";
const LEFT_WHEEL_INDEX = 0;
const RIGHT_WHEEL_INDEX = 1;
const LEFT_WHEEL_ID = (0x01 << LEFT_WHEEL_INDEX);
const RIGHT_WHEEL_ID = (0x01 << RIGHT_WHEEL_INDEX);

const Wheels = (() => {
    const WHEEL_INDEX = {
        "left": 0,
        "right": 1
    };
    const WHEEL_NAME = [
        "left",
        "right"
    ];
    const WHEEL_ID = [
        0x01,
        0x02
    ]

    function count() {
        return WHEEL_NAME.length;
    }

    function name(wheelIndex) {
        return WHEEL_NAME[wheelIndex];
    }

    function index(wheelName) {
        return WHEEL_INDEX[wheelName];
    }

    function id(wheelName) {
        return WHEEL_ID[wheelName];
    }

    const self = Object.freeze({
        "name": name,
        "index": index,
        "id": id,
        "count": count,
    });

    return self
})();
const WHEEL_ID = {
    "left": 1,
    "right": 2,
};
const WHEEL_NAME = [
    "left",
    "right"
];

const WHEEL_COUNT = WHEEL_NAME.length

function wheelNumber(wheelName) {
    return WHEEL_ID[wheelName];
}

function wheelName(wheelNumber) {
    return WHEEL_NAME[wheelNumber - 1];
}


const config = function() {

    function telemetryPlotMs() { return 10000; }

    function telemetryBufferSize() { return 200; }
    function poseTelemetrySize() { return 200; }

    function chartBackgroundColor() { return "#181818" /*"#363636"*/; };
    function chartAxisColor() { return "#EFEFEF"; }
    function leftSpeedColor() { return "lightblue"; }
    function rightSpeedColor() { return "blue"; }
    function leftTargetColor() { return "lightgreen"; }
    function rightTargetColor() { return "green"; }
    function leftPwmColor() { return "lightyellow"; }
    function rightPwmColor() { return "yellow"; }
    function poseLineColor() { return "pink"; }
    function posePointColor() { return "red"; }
    function averageSpeedMs() { return 2000; }

    const self = {
        "telemetryPlotMs": telemetryPlotMs,
        "telemetryBufferSize": telemetryBufferSize,
        "poseTelemetrySize": poseTelemetrySize,
        "chartBackgroundColor": chartBackgroundColor,
        "chartAxisColor": chartAxisColor,
        "leftSpeedColor": leftSpeedColor,
        "rightSpeedColor": rightSpeedColor,
        "leftTargetColor": leftTargetColor,
        "rightTargetColor": rightTargetColor,
        "leftPwmColor": leftPwmColor,
        "rightPwmColor": rightPwmColor,
        "poseLineColor": poseLineColor,
        "posePointColor": posePointColor,
        "averageSpeedMs": averageSpeedMs,
    }

    return self;
}();



function CanvasViewController(cssContainer, cssCanvas, canvasPainter, messageBus, updateMessage) {
    
    let _container = undefined;

    
    let _canvas = undefined;

    
    let _dirtyCanvas = true;

    
    let _dirtySize = true;

    
    let _animationFrame = 0

    const _setCanvasSize = () => {
        // make canvas coordinates match element size
        _canvas.width = _canvas.clientWidth;
        _canvas.height = _canvas.clientHeight;
    }

    const isViewAttached = () => // RET: true if view is in attached state
    {
        return !!_container;
    }

    const attachView = () => {
        if (isViewAttached()) {
            console.log("Attempt to attach canvas view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);
        _canvas = _container.querySelector(cssCanvas);
        _setCanvasSize();

        canvasPainter.attachCanvas(_canvas);

        return self;
    }

    const detachView = () => {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        _container = undefined;
        _canvas = undefined;

        canvasPainter.detachCanvas();

        return self;
    }

    let _listening = 0;

    const isListening = () => {
        return _listening > 0;
    }

    const startListening = () => {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            _container.addEventListener("resize", _onResize);

            // 
            // if there is an update message,
            // then start listening for it.
            //
            if((!!messageBus) && (typeof updateMessage === "string")) {
                messageBus.subscribe(updateMessage, self);
            }
        }

        if(isListening()) {
            _dirtySize = true;  // bit of a hack, but critical 
                                // for canvas to pickup initial
                                // size while it's tab container
                                // is visible; before tab controller
                                // initializes, which may hide it.
            _updateLoop(performance.now());
        }

        return self;
    }

    const stopListening = () => {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {
            _container.removeEventListener("resize", _onResize);

            // 
            // stop listening for update message,
            //
            if((!!messageBus) && (typeof updateMessage === "string")) {
                messageBus.unsubscribe(updateMessage, self);
            }

            window.cancelAnimationFrame(_animationFrame);
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    const isViewShowing = () => {
        return _showing > 0;
    }

    const showView = () => {
        _showing += 1;
        if (1 === _showing) {
            _dirtySize = true;
            show(_container);
        }
        return self;
    }

    const hideView = () => {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    const updateView = (force = false) => {
        if(force || _dirtyCanvas) {
            canvasPainter.paint();
            _dirtyCanvas = false;
        }
        return self;
    }

    const _updateSize = (force = false) => {
        if(force || _dirtySize) {
            _setCanvasSize();
            _dirtyCanvas = true;    // force a redraw
            _dirtySize = false;
            return true;
        }
        return false;
    }

    const _onResize = (event) => {
        _updateSize(true);
    }

    const onMessage = (message, data, specifier = undefined) => {
        if(message === updateMessage) {
            // mark canvas as dirty
            _dirtyCanvas = true;
        }
    }

    const _updateLoop = (timeStamp) => {
        _updateSize();  // resize before redrawing
        updateView();

        if (isListening()) {
            _animationFrame = window.requestAnimationFrame(_updateLoop);
        }
    }

    
    const self = Object.freeze({
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
        "updateView": updateView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    });

    return self;
}



function CommandSocket(hostname, port=82, messageBus = undefined) {
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
    // while a command is sent, but not acknowledged
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

    function clearError() {
        _sentCommand = "";
        _errorMessage = "";
    }

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
                        // reflect telemetry to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out the telemetry packet and publish it
                        if(messageBus) {
                            const telemetry = JSON.parse(msg.data.slice(4, msg.data.lastIndexOf(")")));    // skip 'tel('
                            messageBus.publish("telemetry", telemetry);
                        }
                    } else if(msg.data.startsWith("pose(")) {
                        // reflect pose to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out pose change and publish it
                        if(messageBus) {
                            const pose = JSON.parse(msg.data.slice(5, msg.data.lastIndexOf(")")));    // skip 'pose('
                            messageBus.publish("pose", pose);
                        }
                    } else if(msg.data.startsWith("goto(")) {
                        // reflect pose to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out pose change and publish it
                        if(messageBus) {
                            // like: '{"goto":{"x":-300.000000,"y":0.000000,"a":3.141593,"state":"ACHIEVED","at":707869}}'
                            const gotoGoal = JSON.parse(msg.data.slice(5, msg.data.lastIndexOf(")")));    // skip 'goto('
                            messageBus.publish("goto", gotoGoal);
                        }
                    } else if(msg.data.startsWith("set(")) {
                        // reflect settings to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out setting change and publish it
                        if(messageBus) {
                            const setting = JSON.parse(msg.data.slice(4, msg.data.lastIndexOf(")")));    // skip 'set('
                            messageBus.publish("set", setting);
                        }
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

    
    const self = Object.freeze({
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
    });

    return self;
}
//
//

const hide = el => {
    el.classList.add('hidden')
}

const show = el => {
    el.classList.remove('hidden')
}

const disable = el => {
    el.classList.add('disabled')
    el.setAttribute('disabled', '')
}

const enable = el => {
    el.classList.remove('disabled')
    el.removeAttribute('disabled')
}

const has_value = el => {
    return (el instanceof HTMLInputElement) || 
           (el instanceof HTMLSelectElement) ||
           (el instanceof HTMLMeterElement) ||
           (el instanceof HTMLProgressElement) ||
           (el instanceof HTMLButtonElement) ||
           (el instanceof HTMLOptionElement) ||
           (el instanceof HTMLLIElement);
}

const set_value = (el, value) => {
    if ((el instanceof HTMLInputElement) || 
        (el instanceof HTMLSelectElement) ||
        (el instanceof HTMLMeterElement) ||
        (el instanceof HTMLProgressElement) ||
        (el instanceof HTMLButtonElement) ||
        (el instanceof HTMLOptionElement) ||
        (el instanceof HTMLLIElement)) {
        el.value = value;
    }
}


const get_value = (el) => {
    if ((el instanceof HTMLInputElement) || 
        (el instanceof HTMLSelectElement) ||
        (el instanceof HTMLMeterElement) ||
        (el instanceof HTMLProgressElement) ||
        (el instanceof HTMLButtonElement) ||
        (el instanceof HTMLOptionElement) ||
        (el instanceof HTMLLIElement)) {
        return el.value
    }
    return undefined
}

const has_checked = (el) => {
    return (el instanceof HTMLInputElement && el.type == "checkbox")
}


const get_checked = (el) => {
    if (el instanceof HTMLInputElement && el.type == "checkbox") {
        return el.checked
    }
    return undefined
}

const set_checked = (el, checked) => {
    if (el instanceof HTMLInputElement && el.type == "checkbox") {
        el.checked = checked
    }
}


function assert(assertion) {
    if (true != assertion) {
        throw new Error("assertion failed");
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

function max(x, y) {
    if("number" !== typeof x) throw new TypeError();
    if("number" !== typeof y) throw new TypeError();
    return (x >= y) ? x : y;
}

function min(x, y) {
    if("number" !== typeof x) throw new TypeError();
    if("number" !== typeof y) throw new TypeError();
    return (x < y) ? x : y;
}

function isValidNumber(value, min = undefined, max = undefined, exclusive = false) {
    // must be a number
    let valid = (typeof value === "number");
    
    // must be at or above min if there is a min
    valid = valid && 
        ((typeof min === "undefined") || 
         ((typeof min === "number") && exclusive ? (value > min) : (value >= min)));
    
    // must be at or below max if there is a max
    valid = valid && 
        ((typeof max === "undefined") || 
         ((typeof max == "number") && exclusive ? (value < max) : (value <= max)));
    
    return valid;
}

function constrain(value, min, max) {
    if (typeof value !== "number") throw new TypeError();
    if (typeof min !== "number") throw new TypeError();
    if (typeof max !== "number") throw new TypeError();
    if (min > max) throw new Error();

    if (value < min) return min;
    if (value > max) return max;
    return value;
}

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

function filterList(list, filterFunction) {
    var elements = [];

    // Loop through each element, apply filter and push to the array
    if (typeof filterFunction === "function") {
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

function removeAllFromList(list, element) {
    if (list) {
        let index = list.indexOf(element);
        while (index >= 0) {
            list.splice(index, 1);
            index = list.indexOf(element, index);
        }
    }
}

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

function GamepadMapper() {

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

    
    const self = {
        "mapGamePadValues": mapGamePadValues,
        "mapAxisRange": mapAxisRange,
        "mapButtonRange": mapButtonRange,
        "connectedGamePads": connectedGamePads,
    }

    return self;
}


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
            window.cancelAnimationFrame(_requestAnimationFrameNumber);
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

    function _gameloop(timeStamp) {
        updateView();

        if (_listening) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_gameloop);
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


    function _onGamepadConnected(gamepad) {
        // update state with new list of gamepads
        _updateConnectedGamePads();
        _gamePadState.setValue("selected", gamepad.index);
        _gamePadState.setValue("axisCount", gamepad.axes.length);
    }

    function _onGamepadConnectedEvent(event) {
        _onGamepadConnected(event.gamepad);
    }

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
        if (event.target) {
            console.log(`_onGamePadChanged(${event.target.value})`);
            _gamePadState.setValue("selected", parseInt(event.target.value));
            _updateConnectedGamePads();
        }
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

    function _clearOptions(select) {
        ViewWidgetTools.clearSelectOptions(select);
    }

    function _assert(test) {
        if (!test) {
            throw new Error();
        }
    }

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



const GotoGoalModel = (function() {
    const NOT_RUNNING = "NOT_RUNNING";
    const STARTING = "STARTING";
    const RUNNING = "RUNNING";
    const ACHIEVED = "ACHIEVED";

    
    const _defaultModel =  {
        state: NOT_RUNNING, // state
        x: 0,               // x position 
        y: 0,               // y position
        pointForward: 0.75, // point forward as fraction of wheelbase
        tolerance: 0,       // goal achieved when distance to goal <= tolerance
    };

    let _model = {..._defaultModel};

    function get(key) {
        if(_defaultModel.hasOwnProperty(key)) {
            return _model[key];
        }
        return undefined;
    }

    function set(key, value) {
        if(_defaultModel.hasOwnProperty(key)) {
            _model[key] = value;
        }
    }

    function reset() {
        _model = {..._defaultModel};
    }

    function state() {
        return _model.state;
    }

    function setState(state) {
        _model.state = state;
        return self;
    }

    function x() {
        return _model.x;
    }

    function setX(x) {
        _model.x = x;
        return self;
    }

    function y() {
        return _model.y;
    }

    function setY(y) {
        _model.y = y;
        return self;
    }

    function tolerance() {
        return _model.tolerance;
    }

    function setTolerance(tolerance) {
        _model.tolerance = tolerance;
        return self;
    }

    function pointForward() {
        return _model.pointForward;
    }

    function setPointForward(pointForward) {
        _model.pointForward = pointForward;
        return self;
    }

    function toObject() {
        return {
            "state": state(),
            "x": x(),
            "y": y(),
            "pointForward": pointForward(),
            "tolerance": tolerance(),
        };
    }

    
    const self = {
        "get": get,
        "set": set,
        "reset": reset,
        "state": state,
        "setState": setState,
        "x": x,
        "setX": setX,
        "y": y,
        "setY": setY,
        "pointForward": pointForward,
        "setPointForward": setPointForward,
        "tolerance": tolerance,
        "setTolerance": setTolerance,
        "toObject": toObject,
    }
    return self;

})();/// <reference path="config.js" />




function GotoGoalViewController(
    roverCommand, 
    cssContainer, 
    cssXInput, 
    cssYInput, 
    cssToleranceInput, 
    cssForwardPointRange, // IN : RangeWidgetController selectors
    cssOkButton,
    cssCancelButton,
    messageBus = undefined) // IN : MessageBus to listen for goto-update messages
{
    const defaultState = {
        x: 0.0,                 // goal's x position
        xValid: false,          // true x is a valid number
        y: 0.0,                 // goal's y position 
        yValid: false,          // true if y is a valid number
        tolerance: 0.0,         // error tolerance
        toleranceValid: false,  // true if tolerance is a valid number
        pointForward: 0.75,     // forward point as fraction of wheelbase
        pointForwardLive: 0.75, // forward point as fraction of wheelbase, live drag value
        okEnabled: false,       // true of ok button can be clicked
    };

    // separate state for each wheel
    const _state = RollbackState(defaultState);
    let _syncModel = false;   // true to send the model values to the rover

    
    let _container = undefined;

    
    let _xInput = undefined;

    
    let _yInput = undefined;

    
    let _toleranceInput = undefined;

    
    let _okButton = undefined;

    
    let _cancelButton = undefined;

    
    let _model = undefined;

    // range widget controller for forward point
    const _pointForwardRange = RangeWidgetController(
        _state, "pointForward", "pointForwardLive", 
        1.0, 0.5, 0.01, 2, 
        cssForwardPointRange);

    function _initState(model) {
        _state.setValue("x", model.x());
        _state.setValue("xValid", typeof model.x() === "number");
        _state.setValue("y", model.y());
        _state.setValue("yValid", typeof model.y() === "number");
        _state.setValue("tolerance", model.tolerance());
        _state.setValue("toleranceValid", typeof model.tolerance() === "number");
        _state.setValue("pointForward", model.pointForward());
        _state.setValue("okEnabled", false);

        _syncModel = false;
    }

    function _syncState(model) {
        model.setX(_state.getValue("x"));
        model.setY(_state.getValue("y"));
        model.setTolerance(_state.getValue("tolerance"));
        model.setPointForward(_state.getValue("pointForward"));

        _syncModel = false;
    }

    function isModelBound() {
        return !!_model;
    }

    function bindModel(gotoGoalModel) {
        if(isModelBound()) throw Error("bindModel called before unbindModel");
        if(typeof gotoGoalModel !== "object") throw TypeError("missing GotoGoalModel");

        // intialize the _state from the _model
        _model = gotoGoalModel;
        _initState(_model);

        return self;
    }

    function unbindModel() {
        _model = undefined;
        return self;
    }

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
        _xInput = _container.querySelector(cssXInput);
        _yInput = _container.querySelector(cssYInput);
        _toleranceInput = _container.querySelector(cssToleranceInput);
        _okButton = _container.querySelector(cssOkButton);
        _cancelButton = _container.querySelector(cssCancelButton);
        _pointForwardRange.attachView();

        updateView(true);   // sync view with state

        return self;
    }

    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if (isViewAttached()) {
            _container = undefined;
            _xInput = undefined;
            _yInput = undefined;
            _toleranceInput = undefined;
            _okButton = undefined;
            _cancelButton = undefined;
            _pointForwardRange.detachView();
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
                _xInput.addEventListener("input", _onXInput);
                _yInput.addEventListener("input", _onYInput);
                _toleranceInput.addEventListener("input", _onToleranceInput);

                _pointForwardRange.startListening();

                _okButton.addEventListener("click", _onOkButton);
                _cancelButton.addEventListener("click", _onCancelButton)

                if(messageBus) {
                    messageBus.subscribe("goto-update", self);
                }
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
                _xInput.removeEventListener("input", _onXInput);
                _yInput.removeEventListener("input", _onYInput);
                _toleranceInput.removeEventListener("input", _onToleranceInput);

                _pointForwardRange.stopListening();

                _okButton.removeEventListener("click", _onOkButton);
                _cancelButton.removeEventListener("click", _onCancelButton)

                if(messageBus) {
                    messageBus.unsubscribe("goto-update", self);
                }
            }
            window.cancelAnimationFrame(_animationFrameNumber);
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
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    function hideView() {
        if (!isViewAttached()) {
            console.log("Attempt to hide a detached view is ignored.");
            return self;
        }

        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    function updateView(force = false) {
        // make sure live state matches state of record
        _pointForwardRange.updateViewState(force);
        _enforceView(force);
        return self;
    }

    function _onXInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "x", "xValid", event.target.value);
    }

    function _onYInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "y", "yValid", event.target.value);
    }

    function _onToleranceInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "tolerance", "toleranceValid", event.target.value);
    }

    function _onOkButton(event) {
        //
        // TODO: copy state to model and send model to rover
        //
        _syncState(_model);
        roverCommand.sendGotoGoalCommand(_model.x(), _model.y(), _model.tolerance(), _model.pointForward());
        console.log("_onOkButton");
    }

    function _onCancelButton(event) {
        // revert to original model values
        _initState(_model);
        roverCommand.sendHaltCommand();
    }

    function onMessage(message, data, specifier=undefined) {
        if(message === "goto-update") {
            switch(_model.state()) {
                case "STARTING": {
                    console.log("We are going to our goal.");
                    return;
                }
                case "NOT_RUNNING": {
                    // force ok button to be enabled
                    _syncModel = true;
                    _state.setValue("okEnabled", true);  // re-enable the start button
                    return;
                }
                case "ACHIEVED": {
                    // TODO: something to indicate we have finished.
                    console.log("We arrived at the goal!");
                    return;
                }
            }
        }
    }

    function _enforceView(force = false) {
        //
        // if any values change, the _syncModel becomes true.
        // if _syncModel is true and all values are valid,
        // then we make the ok button enabled.
        //
        _syncModel = _pointForwardRange.enforceView(force) || _syncModel;
        _syncModel = ViewStateTools.enforceInput(_state, "x", _xInput, force) || _syncModel;
        ViewStateTools.enforceValid(_state, "xValid", _xInput, force); // make text input red if invalid
        _syncModel = ViewStateTools.enforceInput(_state, "y", _yInput, force) || _syncModel;
        ViewStateTools.enforceValid(_state, "yValid", _yInput, force); // make text input red if invalid
        _syncModel = ViewStateTools.enforceInput(_state, "tolerance", _toleranceInput, force) || _syncModel;
        ViewStateTools.enforceValid(_state, "toleranceValid", _toleranceInput, force); // make text input red if invalid
        _state.setValue("okEnabled", _state.getValue("xValid") && _state.getValue("yValid") && _state.getValue("toleranceValid"));
        if(_syncModel && _state.commitValue("okEnabled")) {
            enable(_okButton);
        } else {
            disable(_okButton)
        }
    }

    let _animationFrameNumber = 0;

    function _updateLoop(timeStamp) {
        updateView();

        if (isListening()) {
            _animationFrameNumber = window.requestAnimationFrame(_updateLoop);
        }
    }


    
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
        "onMessage": onMessage,
    });

    return self;
}


const MessageBus = () => {
    const subscriptions = {};

    const subscribe = (message, subscriber) => {
        if (!subscriber) throw new TypeError("Missing subscriber");
        if ("function" !== typeof subscriber["onMessage"]) throw new TypeError("Invalid subscriber");
        if ("string" != typeof message) throw new TypeError("Invalid message");

        let subscribers = subscriptions[message];
        if (!subscribers) {
            subscriptions[message] = (subscribers = []);
        }
        subscribers.push(subscriber);
    }

    const unsubscribe = (message, subscriber) => {
        const subscribers = subscriptions[message];
        if(subscribers) {
            removeFirstFromList(subscribers, subscriber);
        }
    }

    const unsubscribeAll = (subscriber) => {
        for(const message in subscriptions) {
            if(subscriptions.hasOwnProperty(message)) {
                const subscribers = subscriptions[message];
                if(subscribers) {
                    removeAllFromList(subscribers, subscriber);
                }
            }
        }
    }

    const publish = (message, data = null, specifier = undefined, subscriber = undefined) => {
        if ("string" != typeof message) throw new TypeError("Invalid message");

        if (subscriber) {
            // direct message
            if ("function" !== typeof subscriber["onMessage"]) throw new TypeError("Invalid subscriber");

            subscriber.onMessage(message, data, specifier);
        } else {
            // broadcase message
            let subscribers = subscriptions[message];
            if (subscribers) {
                subscribers.forEach(subscriber => subscriber.onMessage(message, data, specifier));
            }
        }
    }

    const exports = Object.freeze({
        "publish": publish,
        "subscribe": subscribe,
        "unsubscribe": unsubscribe,
        "unsubscribeAll": unsubscribeAll,
    });

    return exports;
}


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

    function isListening() {
        return _listening > 0;
    }

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

    let _animationFrameNumber = 0;

    function _gameloop(timeStamp) {
        updateView();
        _syncMotorStall();

        if (_listening) {
            _animationFrameNumber = window.requestAnimationFrame(_gameloop);
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
}/// <reference path="utilities.js" />

// #include "./utilities.js"




function Point(x, y) {
    if (typeof x !== "number" || typeof y !== "number") {
        console.log(`WARNING: Point constructed with non-number (${x},${y})`)
    }
    return {x: x, y: y};
}


function Point2dIterator(telemetry) {
    let i = 0;
    function hasNext() {
        return i < telemetry.count();
    }
    function next() {
        if(hasNext()) {
            const value = telemetry.get(i);
            i += 1;
            return Point(value.x, value.y);
        }
        throw RangeError("PointIterator is out of range.")
    }

    return {
        "hasNext": hasNext,
        "next": next,
    }
}




const ChartUtils = (function() {
    function calcBorders(context, tickLength, leftTicksText = "888.8", rightTicksText = "888.8") {
        // leave space for labels
        const leftMetrics = context.measureText(leftTicksText);
        const rightMetrics = context.measureText(rightTicksText);
        const leftBorderWidth = int(leftMetrics.actualBoundingBoxLeft + leftMetrics.actualBoundingBoxRight + tickLength + 2);
        const rightBorderWidth = int(rightMetrics.actualBoundingBoxLeft + rightMetrics.actualBoundingBoxRight + tickLength + 2);

        const borderHeight = int(
            max(leftMetrics.actualBoundingBoxAscent + leftMetrics.actualBoundingBoxDescent, 
                rightMetrics.actualBoundingBoxAscent + rightMetrics.actualBoundingBoxDescent) + tickLength + 2);

        return {
            "left": leftBorderWidth,
            "top": borderHeight,
            "right": rightBorderWidth,
            "bottom": borderHeight,
        };
    }

    const self = Object.freeze({
        "calcBorders": calcBorders,
    });

    return self;
})();


function Axis() {
    let _min = 0;
    let _max = 1;

    
    let _context = undefined;
    let _contextWidth = 0;
    let _contextHeight = 0;
    let _left = 0;
    let _right = 1;
    let _top = 0;
    let _bottom = 1;
    let _ticks = 2;
    let _tickLength = 3;
    let _lineColor = "white";


    function isContextAttached() {
        return !!_context;
    }

    function attachContext(context) {
        _context = context;
        _contextWidth = _context.canvas.width;
        _contextHeight = _context.canvas.height;
        return self;
    }

    function detachContext() {
        _context = null;
        return self;
    }

    function setLineColor(lineColor) {
        _lineColor = lineColor;
        return self;
    }

    function autoSetChartArea(leftTicksText = "888.8", rightTicksText = "888.8") {
        const borders = ChartUtils.calcBorders(_context, _tickLength, leftTicksText, rightTicksText);
        return setChartArea(borders.left, borders.top, _contextWidth - borders.right, _contextHeight - borders.bottom);
    }

    function setChartArea(left, top, right, bottom) {
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

        return self;
    }

    function setMinimum(min) {
        _min = min;
        return self;
    }

    function minimum() {
        return _min;
    }

    function setMaximum(max) {
        _max = max;
        return self;
    }

    function maximum() {
        return _max;
    }

    function mid() {
        return _min + (_max - _min) / 2;
    }

    function setTicks(numberOfTicks) {
        _ticks = numberOfTicks;
        return self;
    }

    function ticks() {
        return _ticks;
    }

    function tickLength() {
        return _tickLength;
    }

    function setTickLength(tickLength) {
        _tickLength = tickLength;
        return self;
    }


    function drawLeftAxis() {
        return _drawAxisY(_left);
    }

    function drawRightAxis() {
        return _drawAxisY(_right);
    }

    function drawLeftTicks() {
        return _drawTicksY(_left, _tickLength);
    }

    function drawRightTicks() {
        return _drawTicksY(_right, -_tickLength);
    }

    function drawBottomAxis() {
        return _drawAxisX(_bottom);
    }

    function drawTopAxis() {
        return _drawAxisX(_top);
    }

    function drawBottomTicks() {
        return _drawTicksX(_bottom, _tickLength);
    }

    function drawTopTicks() {
        return _drawTicksX(_top, -_tickLength);
    }

    function drawLeftText(text, y) {
        return _drawText(text, _left - (_tickLength + 1), _toCanvasY(y), 'right');
    }

    function drawRightText(text, y) {
        return _drawText(text, _right + (_tickLength + 1), _toCanvasY(y), 'left');
    }

    function drawTopText(text, x) {
        return _drawText(text, _toCanvasX(x), _top - (_tickLength + 1), 'center');
    }

    function drawBottomText(text, x) {
        return _drawText(text, _toCanvasX(x), _bottom + (_tickLength + 1), 'center', 'top');
    }

    function _drawText(text, x, y, align = 'center', baseline = 'middle') {
        if(!isContextAttached()) {
            console.error("Drawing Axis text requires an attached context");
            return self;
        }

        if(typeof text !== 'string') {
            return self;
        }

        _context.fillStyle = _lineColor;
        _context.textAlign = align;
        _context.textBaseline = baseline;
        _context.fillText(text, x, y);

        return self;
    }

    function _drawAxisX(y) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(_left, y);
        _context.lineTo(_right, y);
        _context.stroke();

        return self;
    }

    function _drawTicksX(y, tickLength) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;

        const width = (_right - _left);
        for(let i = 0; i < _ticks; i += 1) {
            const x = _left + ((_ticks > 1) ? int(i * width / (_ticks - 1)) : 0);
            _context.beginPath();
            _context.moveTo(x, y);
            _context.lineTo(x, y + tickLength);
            _context.stroke();
        }
        return self;
    }

    function _drawAxisY(x) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }
        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(x, _bottom);
        _context.lineTo(x, _top);
        _context.stroke();

        return self;
    }

    function _drawTicksY(x, tickLength) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;

        const height = (_bottom - _top);
        for(let i = 0; i < _ticks; i += 1) {
            const y = _bottom - ((_ticks > 1) ? int(i * height / (_ticks - 1)) : 0)
            _context.beginPath();
            _context.moveTo(x, y);
            _context.lineTo(x - tickLength, y);
            _context.stroke();
        }
        return self;
    }

    function _toCanvasX(x) {
        return int(map(x, minimum(), maximum(), _left, _right));
    }

    function _toCanvasY(y) {
        return int(map(y, minimum(), maximum(), _bottom, _top));
    }

    
    const self = {
        "isContextAttached": isContextAttached,
        "attachContext": attachContext,
        "detachContext": detachContext,
        "setLineColor": setLineColor,
        "setChartArea": setChartArea,
        "autoSetChartArea": autoSetChartArea,
        "setMinimum": setMinimum,
        "minimum": minimum,
        "setMaximum": setMaximum,
        "maximum": maximum,
        "mid": mid,
        "setTicks": setTicks,
        "ticks": ticks,
        "setTickLength": setTickLength,
        "tickLength": tickLength,
        "drawLeftAxis": drawLeftAxis,
        "drawRightAxis": drawRightAxis,
        "drawLeftTicks": drawLeftTicks,
        "drawRightTicks": drawRightTicks,
        "drawTopAxis": drawTopAxis,
        "drawBottomAxis": drawBottomAxis,
        "drawTopTicks": drawTopTicks,
        "drawBottomTicks": drawBottomTicks,
        "drawLeftText": drawLeftText,
        "drawRightText": drawRightText,
        "drawTopText": drawTopText,
        "drawBottomText": drawBottomText,
    }

    return self;
}

function LineChart() {
    
    let _context = undefined;
    let _contextWidth = 0;
    let _contextHeight = 0;
    let _left = 0;
    let _right = 1;
    let _top = 0;
    let _bottom = 1;
    let _lineColor = "blue";
    let _pointColor = "red";
    let _textColor = "green";

    function isContextAttached() {
        return !!_context;
    }

    function attachContext(context) {
        _context = context;
        _contextWidth = _context.canvas.width;
        _contextHeight = _context.canvas.height;
        return self;
    }

    function detachContext() {
        _context = null;
        return self;
    }

    function setLineColor(lineColor) {
        _lineColor = lineColor;
        return self;
    }

    function setPointColor(pointColor) {
        _pointColor = pointColor;
        return self;
    }

    function setTextColor(textColor) {
        _textColor = textColor;
        return self;
    }

    function autoSetChartArea(leftTicksText = "888.8", rightTicksText = "888.8") {
        const borders = ChartUtils.calcBorders(_context, 0 /*_tickLength*/, leftTicksText, rightTicksText);
        return setChartArea(borders.left, borders.top, _contextWidth - borders.right, _contextHeight - borders.bottom);
    }

    function setChartArea(left, top, right, bottom) {
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

        return self;
    }

    function _pointInChartArea(pt) {
        return ((pt.x >= _left) && (pt.x < _right) 
                && (pt.y >= _top) && (pt.y < _bottom));
    }


    function pointInChart(pt, xAxis, yAxis) {
        return ((pt.x >= xAxis.minimum()) && (pt.x <= xAxis.maximum()) 
                && (pt.y >= yAxis.minimum()) && (pt.y <= yAxis.maximum()));
    }

    function plot(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        if(dataIterator.hasNext()) {
            let p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            while(dataIterator.hasNext()) {
                const p1 = toCanvas(dataIterator.next(), xAxis, yAxis);

                if(_pointInChartArea(p0)) 
                {
                    //
                    // line segment from p0 to p1
                    //
                    if(_pointInChartArea(p1)) {
                        _line(p0, p1)
                    }

                    //
                    // point at p0
                    //
                    _point(p0);
                }
                p0 = p1
            }

            // last point
            if(_pointInChartArea(p0)) {
                _point(p0);
            }
        }

        return self;
    }

    function plotLine(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        if(dataIterator.hasNext()) {
            let p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            while(dataIterator.hasNext()) {
                const p1 = toCanvas(dataIterator.next(), xAxis, yAxis);

                //
                // line segment from p0 to p1
                //
                if(_pointInChartArea(p0)) 
                {
                    if(_pointInChartArea(p1)) {
                        _line(p0, p1)
                    }
                }
                p0 = p1
            }
        }

        return self;
    }

    function plotPoints(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        while(dataIterator.hasNext()) {
            const p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            if(_pointInChartArea(p0)) {
                _point(p0);
            }
        }

        return self;
    }

    function drawPoint(p0, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        const chartPt = toCanvas(p0, xAxis, yAxis);
        if(_pointInChartArea(chartPt)) {
            _point(chartPt);
        }

        return self;
    }

    function drawHorizontal(y, xAxis, yAxis, dashOn = 0, dashOff = 0) {
        if(!isContextAttached()) {
            console.error("Drawing requires an attached context");
            return self;
        }

        if(y >= yAxis.minimum() && y <= yAxis.maximum()) {
            if((typeof dashOn === "number") && (dashOn > 0)) {
                const onPixels = dashOn;
                let offPixels = dashOff;
                if((typeof dashOff === "number") && (dashOff > 0)) {
                    offPixels = dashOff;
                }
                _context.setLineDash([onPixels, offPixels]);
            }
            const p0 = toCanvas(Point(xAxis.minimum(), y), xAxis, yAxis);
            const p1 = toCanvas(Point(xAxis.maximum(), y), xAxis, yAxis);
            _line(p0, p1);
            _context.setLineDash([]);   // reset to solid line

        }

        return self;
    }

    function drawVertical(x, xAxis, yAxis, dashOn = 0, dashOff = 0) {
        if(!isContextAttached()) {
            console.error("Drawing requires an attached context");
            return self;
        }

        if(x >= xAxis.minimum() && x <= xAxis.maximum()) {
            if((typeof dashOn === "number") && (dashOn > 0)) {
                const onPixels = dashOn;
                let offPixels = dashOff;
                if((typeof dashOff === "number") && (dashOff > 0)) {
                    offPixels = dashOff;
                }
                _context.setLineDash([onPixels, offPixels]);
            }
            const p0 = toCanvas(Point(x, yAxis.minimum()), xAxis, yAxis);
            const p1 = toCanvas(Point(x, yAxis.maximum()), xAxis, yAxis);
            _line(p0, p1);
            _context.setLineDash([]);   // reset to solid line
        }

        return self;
    }

    function drawText(text, x, y, xAxis, yAxis, align = 'center', baseline = 'middle') {
        if(!isContextAttached()) {
            console.error("Drawing Chart text requires an attached context");
            return self;
        }

        if(x >= xAxis.minimum() && x <= xAxis.maximum()) {
            if((y >= yAxis.minimum()) && (y <= yAxis.maximum())) {
                const p0 = toCanvas(Point(x, y), xAxis, yAxis);
                _drawText(text, p0.x, p0.y, align, baseline);
            }
        }

        return self;
    }

    function toCanvas(pt, xAxis, yAxis) {
        const x = int(map(pt.x, xAxis.minimum(), xAxis.maximum(), _left, _right - 1));
        const y = int(map(pt.y, yAxis.minimum(), yAxis.maximum(), _bottom - 1, _top));

        return Point(x, y);
    }

    function toAxes(pt, xAxis, yAxis) {
        const x = map(pt.x, _left, _right - 1, xAxis.minimum(), xAxis.maximum());
        const y = map(pt.y, _bottom - 1, _top, yAxis.minimum(), yAxis.maximum());

        return Point(x, y);
    }

    function _line(p0, p1) {
        //
        // line segment from p0 to p1
        //
        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(p0.x, p0.y);
        _context.lineTo(p1.x, p1.y);
        _context.stroke();
    }    

    function _point(pt) {
        _context.strokeStyle = _pointColor;
        _context.beginPath();
        _context.moveTo(pt.x - 1, pt.y - 1);
        _context.lineTo(pt.x + 1, pt.y - 1);
        _context.lineTo(pt.x + 1, pt.y + 1);
        _context.lineTo(pt.x - 1, pt.y + 1);
        _context.lineTo(pt.x - 1, pt.y - 1);
        _context.stroke();
    }

    function _drawText(text, x, y, align = 'center', baseline = 'middle') {
        _context.fillStyle = _textColor;
        _context.textAlign = align;
        _context.textBaseline = baseline;
        _context.fillText(text, x, y);
    }


    function _validateDataIterator(dataIterator) {
        //
        // make sure dataIterator is a valid iterator
        //
        if((!dataIterator.hasOwnProperty("hasNext")) || (typeof dataIterator.hasNext != "function")) {
            throw TypeError("dataIterator must have a hasNext method");
        }
        if((!dataIterator.hasOwnProperty("next")) || (typeof dataIterator.next != "function")) {
            throw TypeError("dataIterator must have a next method");
        }
    }

    
    const self = {
        "isContextAttached": isContextAttached,
        "attachContext": attachContext,
        "detachContext": detachContext,
        "setLineColor": setLineColor,
        "setPointColor": setPointColor,
        "setTextColor": setTextColor,
        "setChartArea": setChartArea,
        "autoSetChartArea": autoSetChartArea,
        "pointInChart": pointInChart,
        "toCanvas": toCanvas,
        "toAxes": toAxes,
        "plot": plot,
        "plotLine": plotLine,
        "plotPoints": plotPoints,
        "drawPoint": drawPoint,
        "drawHorizontal": drawHorizontal,
        "drawVertical": drawVertical,
        "drawText": drawText,
    } 

    return self;
}


function PoseCanvasPainter(poseTelemetry) {
    const xAxis = Axis();
    const yAxis = Axis();
    const lineChart = LineChart();
    let _canvas = undefined;
    const _left = 20;
    const _right = 20;
    const _top = 10;
    const _bottom = 20;
    const _backgroundColor = "gainsboro";

    function isCanvasAttached() {
        return !!_canvas;
    }

    function attachCanvas(canvas) {
        _canvas = canvas;

        return self;
    }

    function detachCanvas() {
        _canvas = null;

        return self;
    }

    function paint() {
        if(isCanvasAttached()) {
            let context = _canvas.getContext("2d");

            // clear entire canvas
            context.fillStyle = config.chartBackgroundColor();
            context.fillRect(0, 0, _canvas.width, _canvas.height);

            //
            // area of chart
            //
            const borders = ChartUtils.calcBorders(context, xAxis.tickLength());
            const left = borders.left;
            const right = _canvas.width - borders.right;
            const top = borders.top;
            const bottom = _canvas.height - borders.bottom;
    
            //
            // set axes bounds
            //
            xAxis.attachContext(context).setChartArea(left, top, right, bottom);
            yAxis.attachContext(context).setChartArea(left, top, right, bottom);
                    
            // 
            // draw axes
            //
            xAxis.setLineColor(config.chartAxisColor()).drawTopAxis().drawBottomAxis().drawBottomTicks();
            yAxis.setLineColor(config.chartAxisColor()).drawRightAxis().drawLeftAxis().drawLeftTicks();

            if((poseTelemetry.count() > 0)) {
                // 
                // draw chart
                //
                lineChart.attachContext(context).setChartArea(left, top, right, bottom);

                //
                // Set data range for each axis.
                // Use a square aspect ratio.
                // 
                const xMinimum = poseTelemetry.minimum("x");
                const xMaximum = poseTelemetry.maximum("x");
                const xRange = xMaximum - xMinimum;
                const yMinimum = poseTelemetry.minimum("y");
                const yMaximum = poseTelemetry.maximum("y");
                const yRange = yMaximum - yMinimum;
                
                const canvasWidth = right - left;
                const canvasHeight = bottom - top;
                const xDistancePerPixel = xRange / canvasWidth;   
                const yDistancePerPixel = yRange / canvasHeight;  
                const distancePerPixel = max(xDistancePerPixel, yDistancePerPixel);

                // set distance based on distancePerPixel and aspect ratio
                const xWidth = canvasWidth * distancePerPixel;
                xAxis.setMinimum(xMinimum);
                xAxis.setMaximum(xAxis.minimum() + xWidth);
                const yHeight = canvasHeight * distancePerPixel;
                yAxis.setMinimum(yMinimum);
                yAxis.setMaximum(yAxis.minimum() + yHeight);

                // draw zero axes
                lineChart.setLineColor(config.chartAxisColor());
                lineChart.drawHorizontal(0, xAxis, yAxis, 3, 3);
                lineChart.drawVertical(0, xAxis, yAxis, 3, 3);
                yAxis.drawLeftText("0", 0);
                xAxis.drawTopText("0", 0);

                // (x, y) value
                lineChart.setLineColor(config.poseLineColor()).plotLine(Point2dIterator(poseTelemetry), xAxis, yAxis);
                lineChart.setPointColor(config.posePointColor()).drawPoint(poseTelemetry.last(), xAxis, yAxis);

                // done
                lineChart.detachContext();

                // draw current position and orientation on bottom
                const currentPose = poseTelemetry.last();
                xAxis.drawBottomText(
                    `(${currentPose.x.toFixed(2)}, ${currentPose.y.toFixed(2)}, ${currentPose.a.toFixed(2)}`, 
                    xAxis.mid());
            } else {
                xAxis.setMinimum(0).setMaximum(1);
                yAxis.setMinimum(-1).setMaximum(1);
            }
            
            xAxis.drawBottomText(`${xAxis.minimum().toFixed(1)}`, xAxis.minimum());
            xAxis.drawBottomText(`${xAxis.maximum().toFixed(1)}`, xAxis.maximum());
            yAxis.drawLeftText(`${yAxis.minimum().toFixed(1)}`, yAxis.minimum());
            yAxis.drawLeftText(`${yAxis.maximum().toFixed(1)}`, yAxis.maximum());

            // done and done
            xAxis.detachContext();
            xAxis.detachContext();    
        }
        return self;
    }

    
    const self = {
        "isCanvasAttached": isCanvasAttached,
        "attachCanvas": attachCanvas,
        "detachCanvas": detachCanvas,
        "paint": paint,
    }

    return self;
}


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
    
    function isViewAttached()
    {
        return !!_container;
    }

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
                _rangeInput.addEventListener("change", _onChanged);
                _rangeInput.addEventListener("input", _onLiveUpdate);

                _rangeInc.addEventListener("click", _onIncrement);
                _rangeDec.addEventListener("click", _onDecrement);
            }
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

    function updateView(force = false) {
        // make sure live state matches state of record
        updateViewState(force).enforceView(force);
        return self;
    }

    function updateViewState(force = false) {
        // make sure live state matches state of record
        if(force || rollbackState.isStaged(key)) {
            rollbackState.setValue(liveKey, rollbackState.getValue(key));
        }
        return self;
    }

    function enforceView(force = false) {
        let updated = ViewStateTools.enforceInput(rollbackState, key, _rangeInput, force);

        // NOTE: we don't include the live update in the return value
        ViewStateTools.enforceText(rollbackState, liveKey, _rangeText, force || updated);

        return updated; // return true if state value was updated
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

    
    const self = Object.freeze({
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
    });

    return self;
}


function ResetTelemetryViewController(
    resetFunction,
    telemetryListeners,
    cssContainer,
    cssButton)
{
    
    let _container = undefined;

    
    let _button = undefined;

    function isViewAttached()
    {
        return !!_container;
    }

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
                _button.addEventListener("click", _onClick);
            }
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
                _button.removeEventListener("click", _onClick);
            }
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



const RollbackState = (defaultState = {}) => {
    const baseState = { ...defaultState }; // default committed state
    let committed = { ...defaultState }; // committed state
    let staged = {}; // newly staged state

    const _assertKey = function (key) {
        if ((typeof key !== "string") || ("" === key)) {
            throw TypeError()
        }
    }

    const setStagedValue = function (key, value) {
        _assertKey(key);
        staged[key] = value;
    }

    const getStagedValue = function (key) {
        _assertKey(key);
        return staged[key];
    }

    const getStagedKeys = function () {
        return Object.keys(staged);
    }

    const isStaged = function (key) {
        _assertKey(key);
        return staged.hasOwnProperty(key);
    }

    const isCommitted = function (key) {
        _assertKey(key);
        return committed.hasOwnProperty(key);
    }

    const hasValue = function (key) {
        _assertKey(key);
        return isStaged(key) || isCommitted(key);
    }

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
        return Object.keys(committed);
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

    const rollback = function () {
        staged = {};
    }

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


    const getValue = function (key) {
        _assertKey(key);
        if (isStaged(key)) {
            return staged[key];
        }
        return committed[key];
    }

    const getKeys = function () {
        return getCopy().keys();
    }

    const getCopy = function () {
        return { ...staged, ...committed };
    }

    
    const self = Object.freeze({
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
    });

    return self;
}




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

    let _requestAnimationFrameNumber = 0;

    function start() {
        _started = true;
        _requestAnimationFrameNumber = window.requestAnimationFrame(_processingLoop);
        return self;
    }

    function stop() {
        _started = false;
        window.cancelAnimationFrame(_requestAnimationFrameNumber);
        return self;
    }

    function _processingLoop(timeStamp) {
        _processCommands();
        if (isStarted()) {
            window.requestAnimationFrame(_processingLoop);
        }
    }

    const _turtleCommands = ['stop','forward','reverse','left','right'];

    function isTurtleCommandName(s) {
        // 'stop'|'forward'|'reverse'|'left'|'right'
        return _turtleCommands.includes(s)
    }

    function isReady() {
        return commandSocket && commandSocket.isReady();
    }

    function isSending() {
        return commandSocket && commandSocket.isSending();
    }

    function getSending() {
        return commandSocket ? commandSocket.getSending() : "";
    }

    function hasError() {
        return commandSocket && commandSocket.hasError();
    }

    function getError() {
        return commandSocket ? commandSocket.getError() : "";
    }

    function clear() {
        if (commandSocket) {
            commandSocket.clearError();
        }
        return self;
    }

    function reset() {
        if (commandSocket) {
            commandSocket.reset();
        }
        return self;
    }

    function halt() {
        sendHaltCommand();
        while(_pendingCommands()) {
            _processCommands()
        }
    }


    function syncSpeedControl(wheels, useSpeedControl, minSpeed, maxSpeed, Kp, Ki, Kd) {
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
            assert(isValidNumber(wheels, 1, 3))
            assert(isValidNumber(minSpeed, 0));
            assert(isValidNumber(maxSpeed, minSpeed, undefined, true));
            assert(isValidNumber(Kp));
            assert(isValidNumber(Ki));
            assert(isValidNumber(Kd));

            //
            // use the smallest maxSpeed and largest minSpeed 
            // so that we stay within limits of all wheels
            // when issuing speed commands.
            //
            _minSpeed = (_minSpeed > 0) ? max(_minSpeed, minSpeed) : minSpeed;
            _maxSpeed = (_maxSpeed > 0) ? min(_maxSpeed, maxSpeed) : maxSpeed;

            // tell the rover about the new speed parameters
            _enqueueCommand(_formatSpeedControlCommand(int(wheels), minSpeed, maxSpeed, Kp, Ki, Kd), true);
        } else {
            // turning off speed control
            _minSpeed = 0;
            _maxSpeed = 0;
        }
    }

    function _formatSpeedControlCommand(wheels, minSpeed, maxSpeed, Kp, Ki, Kd) {
        return `pid(${wheels}, ${minSpeed}, ${maxSpeed}, ${Kp}, ${Ki}, ${Kd})`;
    }

    function syncMotorStall(motorOneStall, motorTwoStall) {
        // tell the rover about the new speed parameters
        _enqueueCommand(_formatMotorStallCommand(
            _leftStall = motorOneStall, 
            _rightStall = motorTwoStall),
            true    // configuration is high priority command
        );
    }

    function _formatMotorStallCommand(motorOneStall, motorTwoStall) {
        return `stall(${motorOneStall}, ${motorTwoStall})`;
    }

    function _formatGotoGoalCommand(x, y, tolerance, pointForward) {
        return `goto(${x}, ${y}, ${tolerance}, ${pointForward})`
    }

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

    function sendTankCommand(
        leftValue, rightValue,  
        leftFlip = false, rightFlip = false,    
        leftZero = 0, rightZero = 0)    
    {
        // a zero (stop) command is high priority
        const tankCommand = _formatTankCommand(leftValue, rightValue, leftFlip, rightFlip, leftZero, rightZero);
        return _enqueueCommand(tankCommand, (abs(leftValue) <= leftZero) && (abs(rightValue) <= rightZero));
    }

    function sendHaltCommand() {
        // clear command buffer, make halt next command
        _commandQueue = [];
        return _enqueueCommand("halt()", true);
    }

    function sendResetPoseCommand() {
        return _enqueueCommand("resetPose()", true);
    }

    function sendGotoGoalCommand(x, y, tolerance, pointForward) {
        return _enqueueCommand(_formatGotoGoalCommand(x, y, tolerance, pointForward));
    }

    function _sendCommand(commandString)    
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


    function _formatTankCommand(
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
                // map axis value from minSpeed to maxSpeed
                leftCommandValue = parseFloat(map(abs(leftValue), leftZero, 1.0, _minSpeed, _maxSpeed).toFixed(4));
            } else { 
                // map axis value from stallValue to max engine value (255)
                leftCommandValue = int(map(abs(leftValue), leftZero, 1.0, int(_leftStall * 255), 255));
            }
        }
        let rightCommandValue = 0; 
        if(abs(rightValue) > rightZero) {
            if(_useSpeedControl) {
                // map axis value from minSpeed to maxSpeed
                rightCommandValue = parseFloat(map(abs(rightValue), rightZero, 1.0, _minSpeed, _maxSpeed).toFixed(4));
            } else {
                // map axis value from stallValue to max engine value (255)
                rightCommandValue = int(map(abs(rightValue), rightZero, 1.0, int(_rightStall * 255), 255));
            }
        }

        
        // format command
        if(_useSpeedControl) {
            return `speed(${leftCommandValue}, ${leftValue > 0}, ${rightCommandValue}, ${rightValue > 0})`;
        } else {
            return `pwm(${leftCommandValue}, ${leftValue > 0}, ${rightCommandValue}, ${rightValue > 0})`;
        }
    }

    //
    // command queue
    //
    let _commandQueue = [];
    let _highPriorityQueue = false;  // true if queue should only have high priority commands
    function _enqueueCommand(command, highPriority=false) {
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

    function _pendingCommands() {
        return _commandQueue.length > 0;
    }

    function _processCommands() {
        if(_commandQueue.length > 0) {
            const command = _commandQueue.shift();
            if(typeof command == "string") {
                if(_sendCommand(command)) {
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

    
    const self = Object.freeze({
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
        "isTurtleCommandName": isTurtleCommandName,
        "enqueueTurtleCommand": enqueueTurtleCommand,
        "processTurtleCommand": processTurtleCommand,
        "sendTurtleCommand": sendTurtleCommand,
        "sendJoystickCommand": sendJoystickCommand,
        "sendTankCommand": sendTankCommand,
        "sendHaltCommand": sendHaltCommand,
        "sendResetPoseCommand": sendResetPoseCommand,
        "syncSpeedControl": syncSpeedControl,
        "syncMotorStall": syncMotorStall,
        "sendGotoGoalCommand": sendGotoGoalCommand,
    });

    return self;
}/// <reference path="message_bus.js" />


function RoverViewManager(
    roverCommand, 
    messageBus, 
    turtleViewController, 
    turtleKeyboardControl, 
    tankViewController, 
    joystickViewController, 
    gotoGoalViewController) 
{
    if (!messageBus) throw new Error();

    const FRAME_DELAY_MS = 30;

    const TURTLE_ACTIVATED = "TAB_ACTIVATED(#turtle-control)";
    const TURTLE_DEACTIVATED = "TAB_DEACTIVATED(#turtle-control)";
    const TANK_ACTIVATED = "TAB_ACTIVATED(#tank-control)";
    const TANK_DEACTIVATED = "TAB_DEACTIVATED(#tank-control)";
    const JOYSTICK_ACTIVATED = "TAB_ACTIVATED(#joystick-control)";
    const JOYSTICK_DEACTIVATED = "TAB_DEACTIVATED(#joystick-control)";
    const GOTOGOAL_ACTIVATED = "TAB_ACTIVATED(#goto-goal-control)";
    const GOTOGOAL_DEACTIVATED = "TAB_DEACTIVATED(#goto-goal-control)";

    let _listening = 0;

    function startListening() {
        _listening += 1;
        if (1 === _listening) {
            messageBus.subscribe(TURTLE_ACTIVATED, self);
            messageBus.subscribe(TURTLE_DEACTIVATED, self);
            messageBus.subscribe(TANK_ACTIVATED, self);
            messageBus.subscribe(TANK_DEACTIVATED, self);
            messageBus.subscribe(JOYSTICK_ACTIVATED, self);
            messageBus.subscribe(JOYSTICK_DEACTIVATED, self);
            messageBus.subscribe(GOTOGOAL_ACTIVATED, self);
            messageBus.subscribe(GOTOGOAL_DEACTIVATED, self);
        }
        return self;
    }

    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            messageBus.unsubscribeAll(self);
        }
        return self;
    }

    function isListening() {
        return _listening > 0;
    }


    function onMessage(message, data, specifier=undefined) {
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
            case GOTOGOAL_ACTIVATED: {
                if (gotoGoalViewController && !gotoGoalViewController.isListening()) {
                    gotoGoalViewController.updateView(true).startListening();
                }
                return;
            }
            case GOTOGOAL_DEACTIVATED: {
                if (gotoGoalViewController && gotoGoalViewController.isListening()) {
                    gotoGoalViewController.stopListening();
                }
                return;
            }
            default: {
                console.log("TurtleViewController unhandled message: " + message);
            }

        }
    }

    
    
    let _modeLoop = null; // the command loop for the active command mode.
    let _requestAnimationFrameNumber = 0;

    function _startModeLoop(mode) {
        _stopModeLoop();
        if(!!(_modeLoop = mode)) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_modeLoop);
        }
        return self;
    }

    function _stopModeLoop(mode = null) {
        if(_isModeRunning(mode)) {
            window.cancelAnimationFrame(_requestAnimationFrameNumber);
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
            _requestAnimationFrameNumber = window.requestAnimationFrame(_tankModeLoop);
        }
    }

    function _turtleModeLoop(timeStamp) {
        if (_isModeRunning(_turtleModeLoop)) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + FRAME_DELAY_MS;// about 10 frames per second
                roverCommand.processTurtleCommand();    // send next command in command queue
            }
            _requestAnimationFrameNumber = window.requestAnimationFrame(_turtleModeLoop);
        }
    }

    
    const self = Object.freeze({
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "onMessage": onMessage,
    });

    return self;
}




const SpeedControlModel = (function() {

    
    const _defaultControlValues =  {
        minSpeed: 0.0,              // measured value for minium speed of motors
        maxSpeed: 0.0,              // measured value for maximum speed of motors 
        Kp: 0.0,                    // speed controller proportial gain
        Ki: 0.0,                    // speed controller integral gain
        Kd: 0.0,                    // speed controller derivative gain
    };

    
    let _wheel = [{..._defaultControlValues}, {..._defaultControlValues}];
    let _useSpeedControl = false;

    function useSpeedControl() { return _useSpeedControl; }

    function setUseSpeedControl(useSpeedControl) {
        _useSpeedControl = useSpeedControl;
        return self;
    }

    function minimumSpeed(wheelName) {
        return _wheel[Wheels.index(wheelName)].minSpeed;
    }

    function setMinimumSpeed(wheelName, minSpeed) {
        _wheel[Wheels.index(wheelName)].minSpeed = minSpeed;
        return self;
    }

    function maximumSpeed(wheelName) {
        return _wheel[Wheels.index(wheelName)].maxSpeed;
    }

    function setMaximumSpeed(wheelName, maxSpeed) {
        _wheel[Wheels.index(wheelName)].maxSpeed = maxSpeed;
        return self;
    }

    function Kp(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kp;
    }

    function setKp(wheelName, Kp) {
        _wheel[Wheels.index(wheelName)].Kp = Kp;
        return self;
    }

    function Ki(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kp;
    }

    function setKi(wheelName, Ki) {
        _wheel[Wheels.index(wheelName)].Ki = Ki;
        return self;
    }

    function Kd(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kd;
    }

    function setKd(wheelName, Kd) {
        _wheel[Wheels.index(wheelName)].Kd = Kd;
        return self;
    }

    function toObject(wheelName) {
        return {
            "useSpeedControl": useSpeedControl(),
            "minSpeed": minimumSpeed(wheelName),
            "maxSpeed": maximumSpeed(wheelName),
            "Kp": Kp(wheelName),
            "Ki": Ki(wheelName),
            "Kd": Kd(wheelName),
        };
    }

    
    const self = Object.freeze({
        "useSpeedControl": useSpeedControl,
        "setUseSpeedControl": setUseSpeedControl,
        "minimumSpeed": minimumSpeed,
        "setMinimumSpeed": setMinimumSpeed,
        "maximumSpeed": maximumSpeed,
        "setMaximumSpeed": setMaximumSpeed,
        "Kp": Kp,
        "setKp": setKp,
        "Ki": Ki,
        "setKi": setKi,
        "Kd": Kd,
        "setKd": setKd,
        "toObject": toObject,
    });
    
    return self;
})();/// <reference path="config.js" />



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

    
    let _container = undefined;

    
    let _speedControlCheck = undefined;

    
    let _minSpeedText = undefined;

    
    let _maxSpeedText = undefined;

    
    let _KpGainText = undefined;

    
    let _KiGainText = undefined;

    
    let _KdGainText = undefined;

    
    let _model = undefined;

    let _sendSpeedControl = false;
    let _useSpeedControlChanged = false;
    let _lastSendMs = 0;


    function isModelBound() {
        return !!_model;
    }

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

    function unbindModel() {
        _model = undefined;
        return self;
    }
            
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

        // cssXxxx is a list of selectors
        _minSpeedText = cssMinSpeed.map(selector => _container.querySelector(selector));
        _maxSpeedText = cssMaxSpeed.map(selector => _container.querySelector(selector));
        _KpGainText = cssKpInput.map(selector => _container.querySelector(selector));
        _KiGainText = cssKiInput.map(selector => _container.querySelector(selector));
        _KdGainText = cssKdInput.map(selector => _container.querySelector(selector));

        updateView(true);   // sync view with state

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

    function updateView(force = false) {
        // make sure live state matches state of record
        _enforceView(force);
        return self;
    }

    function _onSpeedControlChecked(event) {
        // update state to cause a redraw on game loop
        _state.forEach(s => s.setValue("useSpeedControl", event.target.checked));
    }

    function _selectState(selectors, id) {
        for(let i = 0; i < selectors.length; i += 1) {
            if(selectors[i] === ("#" + id)) {
                return _state[i];
            }
        }
        return undefined;
    }

    function _onMinSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssMinSpeed, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "minSpeed", "minSpeedValid", event.target.value, 0.0);
        }
    }

    function _onMaxSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssMaxSpeed, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "maxSpeed", "maxSpeedValid", event.target.value, 0.0);
        }
    }

    function _onKpGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKpInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Kp", "KpValid", event.target.value);
        }
    }

    function _onKiGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKiInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Ki", "KiValid", event.target.value);
        }
    }

    function _onKdGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKdInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Kd", "KdValid", event.target.value);
        }
    }

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

    function _updateLoop(timeStamp) {
        updateView();
        _syncSpeedControl();

        if (isListening()) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_updateLoop);
        }
    }

    
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

    
    const exports = Object.freeze({
        "start": start,
        "stop": stop,
        "isReady": isReady,
    });

    return exports;
}


function TabViewController(cssTabContainer, cssTabLinks, messageBus = null) {
    
    let _tabContainer = null;

    
    let _tabLinks = null;

    
    let _tabContentSelector = [];

    
    let _tabContent = [];

    function isViewAttached() {
        return ((!!_tabContainer) && (!!_tabLinks));
    }

    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        _tabContainer = document.querySelector(cssTabContainer);
        _tabLinks = _tabContainer.querySelectorAll(cssTabLinks);

        // collect that tab content associated with each tab
        _tabContent = [];
        _tabContentSelector = [];
        for (let i = 0; i < _tabLinks.length; i += 1) {
            // read value of data-tabcontent attribute
            _tabContentSelector.push(_tabLinks[i].dataset.tabcontent);
            _tabContent.push(document.querySelector(_tabContentSelector[i]))
        }
        if(_tabLinks.length > 0) {
            activateTab(_tabLinks[0]); // select the first tab, hide the others
        }

        return self;
    }

    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        _tabContainer = null;
        _tabLinks = null;
        _tabContent = [];
        _tabContentSelector = [];

        return self;
    }

    let _showing = 0;

    function isViewShowing() {
        return _showing > 0;
    }
    
    function showView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        _showing += 1;
        if (1 === _showing) {
            show(_tabContainer);
        }

        return self;
    }

    function hideView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        _showing -= 1;
        if (0 === _showing) {
            hide(_tabContainer);
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
            if (_tabLinks) {
                _tabLinks.forEach(el => el.addEventListener("click", _onTabClick));
            }
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
            if (_tabLinks) {
                _tabLinks.forEach(el => el.removeEventListener("click", _onTabClick));
            }
        }

        return self;
    }

    function activateTab(tab) {
        for (let i = 0; i < _tabLinks.length; i += 1) {
            const tabLink = _tabLinks[i];
            if (tab === tabLink) {
                // activate this tab's content
                tabLink.classList.add("active");
                if (_tabContent[i]) {
                    show(_tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_ACTIVATED(${_tabContentSelector[i]})`);
                }
            } else {
                // deactivate this tab's content
                tabLink.classList.remove("active");
                if (_tabContent[i]) {
                    hide(_tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_DEACTIVATED(${_tabContentSelector[i]})`);
                }
            }
        }

        return self;
    }

    function _onTabClick(event) {
        // make this tab active and all siblings inactive
        activateTab(event.target);
    }

    
    const self = Object.freeze({
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
    });

    return self;
}/// <reference path="plot.js" />


function TelemetryCanvasPainter(leftTelemetry, rightTelemetry, speedControl) {
    const pwmAxis = Axis();
    const speedAxis = Axis();
    const timeAxis = Axis();
    const lineChart = LineChart();

    
    let _canvas = undefined;
    const _left = 20;
    const _right = 20;
    const _top = 10;
    const _bottom = 20;
    const _backgroundColor = "gainsboro";

    function isCanvasAttached() {
        return !!_canvas;
    }

    function attachCanvas(canvas) {
        _canvas = canvas;

        return self;
    }

    function detachCanvas() {
        _canvas = null;

        return self;
    }

    function signedPwm(value) {
        return value.forward ? value.pwm : -value.pwm;
    }

    function PwmIterator(telemetry) {
        let i = 0;
        function hasNext() {
            return i < telemetry.count();
        }
        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: signedPwm(value),
                };
            }
            throw RangeError("PwmIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    function SpeedIterator(telemetry) {
        let i = 0;

        function hasNext() {
            return i < telemetry.count();
        }

        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: value.speed,
                };
            }
            throw RangeError("SpeedIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    function TargetSpeedIterator(telemetry) {
        let i = 0;
        function hasNext() {
            return i < telemetry.count();
        }
        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: value.target,
                };
            }
            throw RangeError("TargetSpeedIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    function averageSpeed(telemetry, spanMs) {
        if(telemetry.count() > 0) {
            let sum = 0;
            let n = 0;
            const limitMs = telemetry.last().at - spanMs;
            for(let i = telemetry.count() - 1; i >= 0; i -= 1) {
                const data = telemetry.get(i);
                if(data.at >= limitMs) {
                    sum += data.speed;
                    n += 1;
                } else {
                    break;  // rest of data is out of range
                }
            }

            return sum / n;
        }
        return 0;
    }

    function paint() {
        if(isCanvasAttached()) {
            let context = _canvas.getContext("2d");

            // clear entire canvas
            context.fillStyle = config.chartBackgroundColor();
            context.fillRect(0, 0, _canvas.width, _canvas.height);

            //
            // area of chart
            //
            const borders = ChartUtils.calcBorders(context, timeAxis.tickLength());
            const left = borders.left;
            const right = _canvas.width - borders.right;
            const top = borders.top;
            const bottom = _canvas.height - borders.bottom;
    
            //
            // set axes bounds
            //
            timeAxis.attachContext(context).setChartArea(left, top, right, bottom);
            speedAxis.attachContext(context).setChartArea(left, top, right, bottom);
            pwmAxis.attachContext(context).setChartArea(left, top, right, bottom);
                    
            // 
            // draw axes
            //
            timeAxis.setLineColor(config.chartAxisColor()).drawBottomAxis().drawBottomTicks();
            speedAxis.setLineColor(config.chartAxisColor()).drawLeftAxis().drawLeftTicks();
            pwmAxis.setLineColor(config.chartAxisColor()).drawRightAxis().drawRightTicks();

            //
            // trim all values that are outside the configured time window
            //
            const timeSpanMs = config.telemetryPlotMs();
            if(leftTelemetry.count() > 0) {
                leftTelemetry.trimBefore(leftTelemetry.last()["at"] - timeSpanMs);
            }
            if(rightTelemetry.count() > 0) {
                rightTelemetry.trimBefore(rightTelemetry.last()["at"] - timeSpanMs);
            }

            if((leftTelemetry.count() > 0) && (rightTelemetry.count() > 0)) {
                // 
                // draw chart
                //
                lineChart.attachContext(context).setChartArea(left, top, right, bottom);

                //
                // Set data range for time axis.
                // The duration is set in config, so choose the appropriate min and max
                //
                let minimumTimeMs = min(leftTelemetry.first()["at"], rightTelemetry.first()["at"]);
                timeAxis.setMinimum(minimumTimeMs).setMaximum(minimumTimeMs + timeSpanMs);

                // 
                // set speed axis range based on stats kept by telemetry.
                // 
                let minimumSpeed = 0
                minimumSpeed = min(minimumSpeed, leftTelemetry.minimum("speed"));
                minimumSpeed = min(minimumSpeed, rightTelemetry.minimum("speed"));
                minimumSpeed = min(minimumSpeed, leftTelemetry.minimum("target"));
                minimumSpeed = min(minimumSpeed, rightTelemetry.minimum("target"));
                if(minimumSpeed < 0) {
                    minimumSpeed = min(minimumSpeed, -max(speedControl.maximumSpeed("left"), speedControl.maximumSpeed("right")));
                }

                let maximumSpeed = 0
                maximumSpeed = max(maximumSpeed, leftTelemetry.maximum("speed"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("speed"));
                maximumSpeed = max(maximumSpeed, leftTelemetry.maximum("target"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("target"));
                if(maximumSpeed > 0) {
                    maximumSpeed = max(maximumSpeed, max(speedControl.maximumSpeed("left"), speedControl.maximumSpeed("right")));
                }

                speedAxis.setMinimum(minimumSpeed).setMaximum(maximumSpeed);

                // prefer zero for max or min unless range is on either side
                pwmAxis.setMinimum(-255).setMaximum(255);

                // draw zero speed
                lineChart.setLineColor(config.chartAxisColor()).drawHorizontal(0, timeAxis, speedAxis, 3, 3);
                speedAxis.drawLeftText("0", 0);

                // target speed
                lineChart.setLineColor(config.leftTargetColor()).setPointColor(config.leftTargetColor());;
                lineChart.plotLine(TargetSpeedIterator(leftTelemetry), timeAxis, speedAxis);
                lineChart.setLineColor(config.rightTargetColor()).setPointColor(config.rightTargetColor());
                lineChart.plotLine(TargetSpeedIterator(rightTelemetry), timeAxis, speedAxis);

                // measured speed
                lineChart.setLineColor(config.leftSpeedColor()).setPointColor(config.leftSpeedColor());
                lineChart.plotLine(SpeedIterator(leftTelemetry), timeAxis, speedAxis);
                lineChart.setLineColor(config.rightSpeedColor()).setPointColor(config.rightSpeedColor());
                lineChart.plotLine(SpeedIterator(rightTelemetry), timeAxis, speedAxis);

                // pwm value
                lineChart.setLineColor(config.leftPwmColor()).setPointColor(config.leftPwmColor());
                lineChart.plotLine(PwmIterator(leftTelemetry), timeAxis, pwmAxis);
                lineChart.setLineColor(config.rightPwmColor()).setPointColor(config.rightPwmColor());
                lineChart.plotLine(PwmIterator(rightTelemetry), timeAxis, pwmAxis);

                // done
                lineChart.detachContext();
            }
            
            speedAxis.drawLeftText(`${speedAxis.minimum().toFixed(1)}`, speedAxis.minimum());
            speedAxis.drawLeftText(`${speedAxis.maximum().toFixed(1)}`, speedAxis.maximum());
            pwmAxis.drawRightText(`${pwmAxis.minimum()}`, pwmAxis.minimum());
            pwmAxis.drawRightText(`${pwmAxis.maximum()}`, pwmAxis.maximum());
            timeAxis.drawBottomText("0", timeAxis.minimum());
            timeAxis.drawBottomText(`${config.telemetryPlotMs() / 1000}`, timeAxis.maximum());

            // draw average speed along bottom axis
            const leftAverageSpeed = averageSpeed(leftTelemetry, config.averageSpeedMs()).toFixed(1);
            const rightAverageSpeed = averageSpeed(rightTelemetry, config.averageSpeedMs()).toFixed(1); 
            timeAxis.drawBottomText(
                `left = ${leftAverageSpeed}, right = ${rightAverageSpeed}`, 
                timeAxis.minimum() + (0.5 * (timeAxis.maximum() - timeAxis.minimum())));

            // done and done
            pwmAxis.detachContext();
            speedAxis.detachContext();
            timeAxis.detachContext();
    
        }
        return self;
    }

    
    const self = Object.freeze({
        "isCanvasAttached": isCanvasAttached,
        "attachCanvas": attachCanvas,
        "detachCanvas": detachCanvas,
        "paint": paint,
    });

    return self;
}







function TelemetryListener(messageBus, msg, spec, maxHistory) {
    
    let _telemetry = [];

    let _listening = 0;

    
    let _minimum = {};

    
    let _maximum = {};

    function specifier() {
        return spec;
    }

    function message() {
        return msg;
    }

    function isListening() {
        return _listening > 0;
    }

    function startListening() {
        if(1 == (_listening += 1)) {
            messageBus.subscribe(message(), self);
        }

        return self;
    }

    function stopListening() {
        if(0 == (_listening -= 1)) {
            messageBus.unsubscribe(message(), self);
        }

        return self;
    }

    function _maintainMinimum(key, value) {
        if(typeof value === "number") {
            if(typeof _minimum[key] === "number") {
                if(value < _minimum[key]) {
                    _minimum[key] = value;
               }
            } else {
                _minimum[key] = value;
            }
        }
    }

    function _maintainMaximum(key, value) {
        if(typeof value === "number") {
            if(typeof _maximum[key] === "number") {
                if(value > _maximum[key]) {
                    _maximum[key] = value;
                }
            } else {
                _maximum[key] = value;
            }
        }
    }


    function onMessage(msg, data, field_specifier=undefined) {

        function processTelemetry(telemetry) {
            if (telemetry) {
                if(_telemetry.length === maxHistory) {
                    _telemetry.shift();
                }
                _telemetry.push(telemetry);

                //
                // maintain min/max ranges for numeric
                // fields so we can use them when plotting
                //
                for(const [key, value] of Object.entries(telemetry)) {
                    _maintainMaximum(key, value);
                    _maintainMinimum(key, value);
                }

                // publish update message with reference to this telemetry buffer.
                if(messageBus) {
                    messageBus.publish(`${msg}-update`, self);
                }
            }
        }

        if(message() === msg) {
            if (specifier()) {
                if(data.hasOwnProperty(specifier())) {
                    processTelemetry(data[specifier()])
                } 
            }
        }
    }

    function capacity() {
        return maxHistory;
    }

    function count() {
        return _telemetry.length;
    }

    function reset() {
        _telemetry = [];
        _minimum = {};
        _maximum = {};

        // publish update message with reference to this telemetry buffer.
        if(messageBus) {
            messageBus.publish(`${message()}-update`, self);
        }
        return self;
    }

    function first() {
        return get(0);
    }

    function last() {
        return get(count() - 1);
    }

    function maximum(key, defaultValue = 0) {
        return _maximum.hasOwnProperty(key) ? _maximum[key] : defaultValue;
    }

    function minimum(key, defaultValue = 0) {
        return _minimum.hasOwnProperty(key) ? _minimum[key] : defaultValue;
    }

    function get(i) {
        if((i >= 0) && (i < count())) {
            return _telemetry[i];
        }
        throw RangeError("Telemetry.get() out of range");
    }

    function trimBefore(timeStamp) {
        while((_telemetry.length > 0) && (_telemetry[0]['at'] < timeStamp)) {
            // remove first element
            _telemetry.shift()
        }
        return self;
    }


    function iterator() {
        let i = 0;

        function hasNext() {
            return i < self.count();
        }

        function next() {
            if(hasNext()) {
                const value = self.get(i);
                i += 1;
                return value;
            }
            throw RangeError("iterator is out of range.")
        }

        
        return Object.freeze({
            "hasNext": hasNext,
            "next": next,
        });
    }

    
    const self = Object.freeze({
        "message": message,
        "specifier": specifier,
        "capacity": capacity,
        "count": count,
        "reset": reset,
        "get": get,
        "first": first,
        "last": last,
        "minimum": minimum,
        "maximum": maximum,
        "trimBefore": trimBefore,
        "iterator": iterator,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    });

    return self;
}



function TelemetryModelListener(messageBus, msg, spec, model) {
    let _listening = 0;

    //
    // model must have get, set and reset methods
    //
    if(!(model.hasOwnProperty("set") && 
        (typeof model.set === "function") &&
        model.hasOwnProperty("get") &&
        (typeof model.get === "function") &&
        model.hasOwnProperty("reset") &&
        (typeof model.reset === "function")))
    {
        throw TypeError("model must have get, set and reset methods.");
    }

    function specifier() {
        return spec;
    }

    function message() {
        return msg;
    }

    function isListening() {
        return _listening > 0;
    }

    function startListening() {
        if(1 == (_listening += 1)) {
            messageBus.subscribe(message(), self);
        }

        return self;
    }

    function stopListening() {
        if(0 == (_listening -= 1)) {
            messageBus.unsubscribe(message(), self);
        }

        return self;
    }

    function onMessage(msg, data, spec = undefined) {
        if(message() === msg) {
            if(data.hasOwnProperty(specifier())) {
                //
                // copy fields into model
                //
                for(const [key, value] of Object.entries(data[specifier()])) {
                    model.set(key, value);
                }

                // publish update message with reference to this telemetry buffer.
                if(messageBus) {
                    messageBus.publish(`${msg}-update`, self);
                }
            }
        }
    }


    function reset() {
        model.reset();

        // publish update message with reference to this telemetry buffer.
        if(messageBus) {
            messageBus.publish(`${message()}-update`, self);
        }
        return self;
    }

 
    
    const self = Object.freeze({
        "message": message,
        "specifier": specifier,
        "reset": reset,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    });

    return self;
}





function TelemetryViewManager(
    messageBus, 
    motorTelemetryViewController, 
    resetTelemetryViewController, 
    poseTelemetryViewController, 
    resetPoseViewController) 
{
    // we must have a message bus
    if (!messageBus) throw new Error();

    const FRAME_DELAY_MS = 30;

    const MOTOR_ACTIVATED = "TAB_ACTIVATED(#motor-telemetry-container)";
    const MOTOR_DEACTIVATED = "TAB_DEACTIVATED(#motor-telemetry-container)";
    const POSE_ACTIVATED = "TAB_ACTIVATED(#pose-telemetry-container)";
    const POSE_DEACTIVATED = "TAB_DEACTIVATED(#pose-telemetry-container)";

    let listening = 0;

    function startListening() {
        listening += 1;
        if (1 === listening) {
            messageBus.subscribe(MOTOR_ACTIVATED, self);
            messageBus.subscribe(MOTOR_DEACTIVATED, self);
            messageBus.subscribe(POSE_ACTIVATED, self);
            messageBus.subscribe(POSE_DEACTIVATED, self);
        }
        return self;
    }

    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            messageBus.unsubscribeAll(self);
        }
        return self;
    }

    function isListening() {
        return listening > 0;
    }

    function onMessage(message, data, specifier = undefined) {
        switch (message) {
            case MOTOR_ACTIVATED: {
                if (motorTelemetryViewController && !motorTelemetryViewController.isListening()) {
                    motorTelemetryViewController.startListening();
                    resetTelemetryViewController.startListening();
                    messageBus.publish("telemetry-update"); // for update of telemetry canvas
                }
                return;
            }
            case MOTOR_DEACTIVATED: {
                if (motorTelemetryViewController && motorTelemetryViewController.isListening()) {
                    motorTelemetryViewController.stopListening();
                    resetTelemetryViewController.stopListening();
                }
                return;
            }
            case POSE_ACTIVATED: {
                if (poseTelemetryViewController && !poseTelemetryViewController.isListening()) {
                    poseTelemetryViewController.startListening();
                    resetPoseViewController.startListening();
                    messageBus.publish("pose-update"); // for update of pose canvas
                }
                return;
            }
            case POSE_DEACTIVATED: {
                if (poseTelemetryViewController && poseTelemetryViewController.isListening()) {
                    poseTelemetryViewController.stopListening();
                    resetPoseViewController.stopListening();
                }
                return;
            }
            default: {
                console.log("TelemetryViewManager unhandled message: " + message);
            }

        }
    }

    
    const self = Object.freeze({
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "onMessage": onMessage,
    });

    return self;
}


const TURTLE_KEY_DOWN = "TURTLE_KEY_DOWN";
const TURTLE_KEY_UP = "TURTLE_KEY_UP";


function TurtleKeyboardController(messageBus = null) {
    let _listening = 0;

     function startListening() {
        _listening += 1;
        if (1 === _listening) {
            document.body.addEventListener("keydown", _handleRoverKeyDown);
            document.body.addEventListener("keyup", _handleRoverKeyUp);
        }

        return self
    }

    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            document.body.addEventListener("keydown", _handleRoverKeyDown);
            document.body.addEventListener("keyup", _handleRoverKeyUp);
        }

        return self
    }

    function isListening() {
        return _listening > 0;
    }

    function _handleRoverKeyDown(e) {
        if (e.code == '38') {
            // up arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "forward");
            }
        } else if (e.code == '40') {
            // down arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "reverse");
            }
        } else if (e.code == '37') {
            // left arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "left");
            }
        } else if (e.code == '39') {
            // right arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "right");
            }
        }
    }

    function _handleRoverKeyUp(e) {
        if (e.code == '38') {
            // up arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "forward");
            }
        } else if (e.code == '40') {
            // down arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "reverse");
            }
        } else if (e.code == '37') {
            // left arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "left");
            }
        } else if (e.code == '39') {
            // right arrow
            e.preventDefault();
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

    
    let _container = undefined;

    
    let _turtleButtonNames = undefined;

    
    let _turtleButtons = undefined;

    const _speedInput = RangeWidgetController(
        _state, "speedPercent", "speedPercentLive", 
        1.0, 0.0, 0.01, 2, 
        cssRoverSpeedInput)

    function attachView() {
        if(isViewAttached()) throw new Error("Attempt to rebind the view.");

        _container = document.querySelector(cssContainer);
        _turtleButtons = Array.from(_container.querySelectorAll(cssRoverButton));
        _turtleButtonNames = _turtleButtons.map(b => b.id.charAt(0).toUpperCase() + b.id.slice(1));
        _speedInput.attachView();
        return self;
    }

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

    function isViewAttached() {
        return !!_turtleButtons;
    }

    //////////// update the view //////////////

    function updateView(force = false) {
        if (isViewAttached()) {
            _enforceActiveButton(force);
            _speedInput.enforceView(force);
        }
        return self;
    }

    function _updateLoop(timestamp) {
        updateView();

        if(isListening()) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_updateLoop);
        }
    }

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

    function isListening() {
        return _listening > 0;
    }

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


    function _onButtonClick(event) {
        if (roverCommand.isTurtleCommandName(event.target.id)) {
            const buttonId = (event.target.id);
            if (buttonId === _state.getValue("activeButton")) {
                _onButtonUnselected(buttonId);
            } else {
                _onButtonSelected(buttonId);
            }
        }
    }

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

    function _onButtonUnselected(buttonId) {
        _state.setValue("activeButton", "");
        roverCommand.enqueueTurtleCommand("stop", 0); // run stop command
    }

    
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

const ViewStateTools = (function() {

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

    function enforceInput(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    function enforceCheck(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.checked = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

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

    function enforceRange(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    const self = Object.freeze({
        "enforceSelectMenu": enforceSelectMenu,
        "enforceText": enforceText,
        "enforceInput": enforceInput,
        "enforceCheck": enforceCheck,
        "enforceValid": enforceValid,
        "enforceRange": enforceRange,
        "updateNumericState": updateNumericState,
    });

    return self;
}());
const ViewValidationTools = (function() {
    function validateNumericInput(
        value,                  // IN : text to validate as a number
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
                                // RET: if valid, the number
                                //      if invalid, undefined
    {
        //
        // check input type
        //
        let numericValue = undefined
        if (typeof value == "string") {
            numericValue = parseFloat(value);
        } else if (typeof value == "number") {
            numericValue = value
        } else {
            console.log("Value that is not a string or number cannot be validated and is ignored.");
            return undefined
        }

        if (isNaN(numericValue)) return undefined;
        if ((typeof minValue == "number") && (numericValue < minValue)) return undefined;
        if ((typeof maxValue == "number") && (numericValue > maxValue)) return undefined;
        return numericValue;
    }

    const self = {
        "validateNumericInput": validateNumericInput,
    }

    return self;
}());/// <reference path="rollback_state.js" />

const ViewWidgetTools = (function() {
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

    function clearSelectOptions(select) {
        if (select) {
            while (select.options.length > 0) {
                select.remove(0);
            }
        }
    }

    const exports = Object.freeze({
        "onRangeIncrement": onRangeIncrement,
        "onRangeDecrement": onRangeDecrement,
        "clearSelectOptions": clearSelectOptions,
    });

    return exports;
}());/// <reference path="config.js" />


//
// TODO: implement a rover reset command that restarts encoder and pose from zero.
//


document.addEventListener('DOMContentLoaded', function (event) {
    var baseHost = document.location.origin

    const updateValue = (el, value, updateRemote) => {
        updateRemote = updateRemote == null ? true : updateRemote
        let initialValue
        if ((el instanceof HTMLInputElement) && (el.type === 'checkbox')) {
            initialValue = el.checked
            value = !!value
            el.checked = value
        } else {
            initialValue = get_value(el)
            set_value(el, value)
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

    function updateConfig(el) {
        let value = undefined
        if (el instanceof HTMLInputElement) {
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
            }
        } else if (el instanceof HTMLSelectElement) {
            if (el.type == 'select-one') {
                value = el.value;
            }
        }

        if (value != undefined) {
            const query = `${baseHost}/control?var=${el.id}&val=${value}`

            fetch(query)
                .then(response => {
                    console.log(`request to ${query} finished, status: ${response.status}`)
                })
        }
    }

    //
    // Add a handler to all close buttons
    // which 'closes' the parent element 
    // when clicked.
    //
    document
        .querySelectorAll('.close')
        .forEach(el => {
            if (el instanceof HTMLElement) {
                el.onclick = () => {
                    hide(el.parentElement)
                }
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
                for (const [key, value] of Object.entries(state)) {
                    console.log(`${key}: ${value}`);
                    if("enabled" === key) {
                        // hide or show camera controls
                        const doHideShow = value ? show : hide
                        document
                            .querySelectorAll('.camera-ui')
                            .forEach(el => {
                                doHideShow(el)
                            })
                    } else {
                        let el = document.querySelector(`#${key}.default-action`);
                        if(el) {
                            updateValue(el, value, false);
                        }
                    }
                }
                  
                // document
                //     .querySelectorAll('.default-action')
                //     .forEach(el => {
                //         if(state.hasOwnProperty(el.id)) {
                //             updateValue(el, state[el.id], false)
                //         }
                //     })
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
    const commandSocket = CommandSocket(location.hostname, 82, messageBus);
    const roverCommand = RoverCommand(baseHost, commandSocket);

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

    const gotoGoalViewController = GotoGoalViewController(
        roverCommand, 
        "#goto-goal-control", 
        "#goto_goal_x", 
        "#goto_goal_y", 
        "#goto_goal_tolerance", 
        "#point-forward-group",
        "#goto_goal_start",
        "#goto_goal_cancel",
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
        ["#min_speed_0", "#min_speed_1"],
        ["#max_speed_0", "#max_speed_1"],
        ["#proportional_gain_0", "#proportional_gain_1"],
        ["#integral_gain_0", "#integral_gain_1"],
        ["#derivative_gain_0", "#derivative_gain_1"],
    );

    //
    // realtime rover telemetry plotter
    //
    const leftTelemetryListener = TelemetryListener(messageBus, "telemetry", "left", config.telemetryBufferSize());
    const rightTelemetryListener = TelemetryListener(messageBus, "telemetry", "right", config.telemetryBufferSize());
    const telemetryViewController = CanvasViewController(
        "#motor-telemetry", 
        "canvas", 
        TelemetryCanvasPainter(leftTelemetryListener, rightTelemetryListener, SpeedControlModel),
        messageBus,
        "telemetry-update");
    const resetTelemetryViewController = ResetTelemetryViewController(
        undefined, 
        [leftTelemetryListener, rightTelemetryListener], 
        "#motor-telemetry-container .okcancel-container", 
        "#reset-telemetry");
    
    const poseTelemetryListener = TelemetryListener(messageBus, "pose", "pose", config.poseTelemetrySize());
    const poseTelemetryViewController = CanvasViewController(
        "#pose-telemetry", 
        "canvas", 
        PoseCanvasPainter(poseTelemetryListener),
        messageBus,
        "pose-update");
    const resetPoseViewController = ResetTelemetryViewController(
        roverCommand.sendResetPoseCommand, 
        [poseTelemetryListener], 
        "#pose-telemetry-container .okcancel-container", 
        "#reset-pose");

    const telemetryTabController = TabViewController("#rover-telemetry-tabs", ".tablinks", messageBus);
    const telemetryViewManager = TelemetryViewManager(
        messageBus, 
        telemetryViewController,
        resetTelemetryViewController, 
        poseTelemetryViewController, 
        resetPoseViewController);

    const turtleKeyboardControl = TurtleKeyboardController(messageBus);
    const turtleViewController = TurtleViewController(roverCommand, messageBus, '#turtle-control', 'button.rover', '#rover_speed-group');
    
    const roverViewManager = RoverViewManager(
        roverCommand, 
        messageBus, 
        turtleViewController, 
        turtleKeyboardControl, 
        tankViewController, 
        joystickViewController, 
        gotoGoalViewController);
    const roverTabController = TabViewController("#rover-control", ".tablinks", messageBus);

    const configTabController = TabViewController("#configuration-tabs", ".tablinks", messageBus);

    const gotoGoalModelListener = TelemetryModelListener(messageBus, "goto", "goto", GotoGoalModel);
    
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
    speedViewController.bindModel(SpeedControlModel).attachView().updateView(true).hideView().startListening();
    configTabController.attachView().startListening();
    leftTelemetryListener.startListening();
    rightTelemetryListener.startListening();
    telemetryViewController.attachView().updateView(true).showView().startListening();
    poseTelemetryViewController.attachView().updateView(true).showView().startListening();
    resetPoseViewController.attachView().showView().startListening();
    resetTelemetryViewController.attachView().showView().startListening();
    telemetryTabController.attachView().startListening();
    telemetryViewManager.startListening();
    poseTelemetryListener.startListening();
    gotoGoalModelListener.startListening();
    gotoGoalViewController.bindModel(GotoGoalModel).attachView().updateView(true);

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
