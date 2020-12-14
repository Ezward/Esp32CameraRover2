

///////////////// Web Socket for Rover Commands /////////////////
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
                        // reflect telemetry to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out the telemetry packet and publish it
                        if(messageBus) {
                            const telemetry = JSON.parse(msg.data.slice(4, msg.data.lastIndexOf(")")));    // skip 'tel('
                            messageBus.publish("telemetry", telemetry);
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
