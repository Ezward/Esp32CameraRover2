

///////////////// Web Socket Streaming /////////////////

/**
 * @summary A streaming image socket instance.
 * 
 * @typedef {object} StreamingSocketType
 * @property {() => boolean} isReady
 * @property {() => void} start
 * @property {() => void} stop
 */

/**
 * @summary Construct a streaming image socket.
 * 
 * @description
 * The websocket listens for binary data and
 * treats is as a jpeg image.  The image is
 * then assigned to the src attribute of
 * the provided image element.
 * 
 * @param {string} hostname 
 * @param {number} port 
 * @param {HTMLImageElement} imageElement 
 * @returns {StreamingSocketType}
 */
function StreamingSocket(hostname, port, imageElement) {
    //
    // stream images via websocket port 81
    //
    /** @type {WebSocket | null} */
    var socket = null;

    /**
     * @summary Determine if socket is opened and ready.
     * 
     * @returns {boolean}
     */
    function isReady() {
        return socket && (WebSocket.OPEN === socket.readyState);
    }

    /**
     * @summary Open the websocket.
     */
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

    /**
     * @summary Close the websocket.
     */
    function stop() {
        if (socket) {
            if ((socket.readyState !== WebSocket.CLOSED) && (socket.readyState !== WebSocket.CLOSING)) {
                socket.close();
            }
            socket = null;
        }
    }

    /** @type {StreamingSocketType} */
    const exports = Object.freeze({
        "start": start,
        "stop": stop,
        "isReady": isReady,
    });

    return exports;
}
