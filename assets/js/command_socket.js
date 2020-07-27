

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
