const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 81
});

wss.on('connection', ws => {
    console.warn("Connected.");

    ws.on('message', message => {
        if ("string" === typeof message) {
            console.warn(`Received message => ${message}`);
        } else {
            console.warn("Received binary message.");
        }
    });
});
