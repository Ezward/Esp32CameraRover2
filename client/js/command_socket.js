/// <reference path="message_bus.js" />


///////////////// Web Socket for Rover Commands /////////////////
/**
 * @typedef {object} CommandSocketType
 * @property {() => boolean} isStarted
 * @property {() => boolean} isReady
 * @property {() => boolean} isSending
 * @property {() => string} getSending
 * @property {() => boolean} hasError
 * @property {() => string} getError
 * @property {() => void} clearError
 * @property {() => void} reset
 * @property {(textCommand: string, force?: boolean) => boolean} sendCommand
 * @property {() => void} start
 * @property {() => void} stop
 */

/**
 * Web Socket for Rover Commands
 * @param {string} hostname 
 * @param {number} port 
 * @param {MessageBusType} messageBus 
 * @returns {CommandSocketType}
 */
function CommandSocket(hostname, port=82, messageBus = undefined) {
    //
    // stream images via websocket port 81
    //
    var socket = null;

    /**
     * Determine if socket is started.
     * 
     * @returns {boolean}
     */
    function isStarted() {
        return !!socket;
    }

    /**
     * Determine if socket is open and ready.
     * 
     * @returns {boolean}
     */
    function isReady() {
        return socket && (WebSocket.OPEN === socket.readyState);
    }

    //
    // while a command is sent, but not acknowledged
    // isSending() is true and getSending() is the command
    //
    let _sentCommand = "";

    /**
     * Determine if a message is being sent, 
     * but has not yet been acknowledged.
     * 
     * @returns {boolean}
     */
    function isSending() {
        return "" !== _sentCommand;
    }

    /**
     * If isSending() is true, then this returns
     * the command that is being sent, otherwise
     * it returns the empty string.
     * 
     * @returns {string} // RET: command name if isSending() is true,
     *                           empty string if isSending() is false.
     */
    function getSending() {
        return _sentCommand;
    }

    //
    // If a command is not acknowledged, then
    // isError() is true and getError() is the error
    // message returned by the server is and 'ERROR()' frame.
    //
    let _errorMessage = "";

    /**
     * Determine if there was an error.
     * 
     * @returns {boolean} // RET: true if there was an error.
     */
    function hasError() {
        return "" !== _errorMessage;
    }

    /**
     * Get the error message.
     * 
     * @returns {string}  // RET: if hasError() is true, then this returns the error message
     *                            if hasError() is false, then this returns the empty string.
     */
    function getError() {
        return _errorMessage;
    }

    /**
     * clear the sending and error state
     * so we can send another message.
     */
    function clearError() {
        _sentCommand = "";
        _errorMessage = "";
    }

    /**
     * Reset the socket connection
     */
    function reset() {
        stop();
        start();
        clearError();
    }

    /**
     * Send a command across the websocket.
     * 
     * If the socket is not ready (isReady() === false) 
     * then the message will not be sent unless force === true.
     * If there is already a message in the process of being send (isSending() === true)
     * then the message will not be sent unless force === true.
     * If there is a prior error (isError() === true) 
     * then the message will not be sent unless force === true.
     * 
     * Prior to call sendCommand() isSending() should be checked to make sure
     * there is not an command in flight.
     * Prior to calling sendCommand() isError() should be called to see if there
     * is a prior error that would block sending.  If so the error should be handled
     * or it should be cleared with a call to clearError().
     * 
     * @param {string} textCommand // IN : message to send.
     * @param {boolean} force      // IN : ignore any prior send or error.
     * @returns {boolean}          // RET: true if command sent,
     *                                     false if command was not sent.
     *                                     If it was not sent because another message
     *                                     is being sent (isSending() is true) or
     *                                     because there was a prior error that has not
     *                                     been cleared
     *                                     in which case getError() will have the error message.
     */
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

    /**
     * Start the websocket.
     * 
     * If the websocket started then isStarted() will return true.
     */
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

    /**
     * Stop and close the websocket
     */
    function stop() {
        if (socket) {
            if ((socket.readyState !== WebSocket.CLOSED) && (socket.readyState !== WebSocket.CLOSING)) {
                socket.close();
            }
            socket = null;
        }
    }

    /** @type {CommandSocketType} */
    const self = {
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
    return self;
}
