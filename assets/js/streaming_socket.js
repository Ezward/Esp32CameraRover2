

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
