// import constrain from "./utilties.js"
// import int from "./utilities.js"
// import abs from "./utilities.js"


///////////// Rover Command ////////////////
function RoverCommand(host, commandSocket, motorViewController) {
    let running = false;
    let lastCommand = "";
    let commandCount = 0;

    function halt() {
        sendTurtleHttpCommand("halt", 0);
        sendTankCommand(0, 0);
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
     * Send a turtle-style command to the rover.
     * 
     * @param {string} command : 'stop', 'forward', 'reverse', 'left', 'right'
     * @param {number} speedFraction : float from 0.0 to 1.0, fraction of full throttle
     */
    function sendTurtleCommand(
        command,        
        speedFraction)  
    {
        speedFraction = constrain(speedFraction, 0.0, 1.0);

        switch(command) {
            case 'stop': {
                sendTankCommand(0, 0);
                return;
            }
            case 'forward': {
                sendTankCommand(speedFraction, speedFraction);
                return;
            }
            case 'reverse': {
                sendTankCommand(-speedFraction, -speedFraction);
                return;
            }
            case 'left': {
                sendTankCommand(-speedFraction, speedFraction);
                return;
            }
            case 'right': {
                sendTankCommand(speedFraction, -speedFraction);
                return;
            }
            default: {
                console.error("sendTurtleCommand got unrecognized command: " + command);
                return;
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
        sendTankCommand(leftValue, rightValue);
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
     */
    function sendTankCommand(
        leftValue, rightValue,  
        leftFlip = false, rightFlip = false,    
        leftZero = 0, rightZero = 0)    
    {
        if (!commandSocket) return;

        const leftStall = motorViewController ? motorViewController.getMotorOneStall() : 0.0; // float: fraction of full throttle below which engine stalls
        const rightStall = motorViewController ? motorViewController.getMotorTwoStall() : 0.0;// float: fraction of full throttle below which engine stalls

        leftValue = constrain(leftValue, -1.0, 1.0);
        rightValue = constrain(rightValue, -1.0, 1.0);

        // apply flip
        if(leftFlip) {
            leftValue = -(leftValue);
        }
        if(rightFlip) {
            rightValue = -(rightValue);
        }

        // apply zero area (axis zone near zero that we treat as zero)
        let leftCommandValue = 0;   // 0..255
        if(abs(leftValue) > leftZero) {
            // scale range (motorStallValue..motorMaxValue)
            leftCommandValue = map(abs(leftValue), leftZero, 1.0, int(leftStall * 255), 255)
        }
        let rightCommandValue = 0;  // 0..255
        if(abs(rightValue) > rightZero) {
            // map axis value from stallValue to max engine value (255)
            rightCommandValue = map(abs(rightValue), rightZero, 1.0, int(rightStall * 255), 255);
        }
        

        // format command
        const tankCommand = `tank(${int(leftCommandValue)}, ${leftValue >= 0}, ${int(rightCommandValue)}, ${rightValue >= 0})`
        
        //
        // if this is a new command then send it
        //
        if(tankCommand !== lastCommand) {
            if(commandSocket && commandSocket.isReady() && !commandSocket.isSending()) {
                const commandWrapper = `cmd(${commandCount}, ${tankCommand})`
                if(commandSocket.sendCommand(commandWrapper)) {
                    lastCommand = tankCommand;
                    commandCount += 1;
                }
            }
        }
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
        if (isSending() || hasError() || !isReady()) {
            return; // already busy, leave command buffered
        }

        const command = commands.shift();
        const speed = speeds.shift();
        if (("stop" != command) && (lastTurtleCommand === command)) {
            console.log(`command ${command} ignored: rover already is ${command}.`);
            return;
        }

        // sendTurtleHttpCommand(command, speed);   // http
        sendTurtleCommand(command, speed); // websocket
    }

    ////////////// turtle command http api ///////////////
    let httpSending = null;
    function isHttpSending() {
        return !!httpSending;
    }

    let httpError = null;
    function isHttpError() {
        return !!httpError;
    }

    function getHttpError() {
        return httpError;
    }

    function clearHttp() {
        _httpSending = null;
        _httpError = null;
    }


    /**
     * Send a turtle command via HTTP.
     * 
     * @param {string} command : string : 'halt', 'stop', 'forward', 'reverse', 'left', 'right'
     * @param {number} speed255 : integer : 0 to 255
     */
    function sendTurtleHttpCommand(command, speed255) {
        if("halt" != command) {
            if(isHttpError()) return;
            if(isHttpSending()) return;
        } else {
            // convert 'halt' to 'stop'
            command = "stop";
        }

        console.log(`sending ${command}, speed ${speed255}`);
        httpSending = command;
        let url = `${host}/rover?direction=${command}&speed=${speed255}`;
        fetch(url).then((response) => {
            if (200 == response.status) {
                console.log(`${command} fulfilled`);
                lastTurtleCommand = command;
            } else {
                httpError = response.statusText;
                console.log(`${command} rejected: ${response.statusText}`);
                halt();
            }
        }, (reason) => {
            httpError = reason;
            console.log(`${command} failed: ${reason}`);
            halt();
        }).catch((reason) => {
            httpError = reason;
            console.log(`${command} exception: ${reason}`);
            halt();
        }).finally((info) => {
            console.log(`done sending command ${command}`);
            httpSending = null
        })
    }

    const exports = {
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
    }

    return exports;
}