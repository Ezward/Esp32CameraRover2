

///////////////// Web Socket Streaming /////////////////
function StreamingSocket(hostname, imageElement) {
    //
    // stream images via websocket port 81
    //
    var socket = null;

    function start() {
        socket = new WebSocket(`ws://${hostname}:81/ws`, ['arduino']);
        socket.binaryType = 'arraybuffer';

        try {
            socket.onopen = function () {
                console.log("websocket opened");
            }

            socket.onmessage = function (msg) {
                console.log("websocket received message");
                // convert message data to readable blob and assign to img src
                const bytes = new Uint8Array(msg.data); // msg.data is jpeg image
                const blob = new Blob([bytes.buffer]); // convert to readable blob
                imageElement.src = URL.createObjectURL(blob); // assign to img source to draw it
            };

            socket.onclose = function () {
                console.log("websocket closed");
                socket = null;
            }
        } catch (exception) {
            console.log("websocket exception");
        }
    }

    function stop() {
        if (socket) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
            socket = null;
        }
    }

    const exports = {
        "start": start,
        "stop": stop,
    }
    return exports;
}
