// import constrain from "./utilties.js"
// import int from "./utilities.js"
// import abs from "./utilities.js"
// import assert from "./utilities.js"


///////////// Rover Command ////////////////
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

    function start() {
        _started = true;
        window.requestAnimationFrame(_processingLoop);
        return self;
    }

    function stop() {
        _started = false;
        window.cancelAnimationFrame(_processingLoop);
        return self;
    }

    /**
     * Called periodically to process the command queue.
     * 
     * @param {*} timeStamp 
     */
    function _processingLoop(timeStamp) {
        processCommands();
        if (isStarted()) {
            window.requestAnimationFrame(_processingLoop);
        }
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
     * Clear command queue and stop rover.
     */
    function halt() {
        sendHaltCommand();
        processCommands()
    }


    /**
     * Set speed control and send it to rover.
     * 
     * @param {boolean} useSpeedControl 
     * @param {number} minSpeed 
     * @param {number} maxSpeed 
     * @param {number} Kp 
     * @param {number} Ki 
     * @param {number} Kd 
     */
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
            enqueueCommand(formatSpeedControlCommand(int(wheels), minSpeed, maxSpeed, Kp, Ki, Kd), true);
        } else {
            // turning off speed control
            _minSpeed = 0;
            _maxSpeed = 0;
        }
    }

    function formatSpeedControlCommand(wheels, minSpeed, maxSpeed, Kp, Ki, Kd) {
        return `pid(${wheels}, ${minSpeed}, ${maxSpeed}, ${Kp}, ${Ki}, ${Kd})`;
    }

    function syncMotorStall(motorOneStall, motorTwoStall) {
        // tell the rover about the new speed parameters
        enqueueCommand(formatMotorStallCommand(
            _leftStall = motorOneStall, 
            _rightStall = motorTwoStall),
            true    // configuration is high priority command
        );
    }

    function formatMotorStallCommand(motorOneStall, motorTwoStall) {
        return `stall(${motorOneStall}, ${motorTwoStall})`;
    }

    /**
     * Send a turtle-style command to the rover.
     * 
     * @param {string} command       : 'stop', 'forward', 'reverse', 'left', 'right'
     * @param {number} speedFraction : float from 0.0 to 1.0, fraction of full throttle
     * @return {boolean}             : true if command sent, false if not
     */
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


    /**
     * Send a joystick-style command (throttle, steering) to the rover
     * 
     * @param {number} throttleValue : float: joystick axis value -1.0 to 1.0
     * @param {number} steeringValue : float: joystick axis value -1.0 to 1.0
     * @param {boolean} throttleFlip : boolean: true to invert axis value, false to use natural axis value
     * @param {boolean} steeringFlip : boolean: true to invert axis value, false to use natural axis value
     * @param {number} throttleZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero)
     * @param {number} steeringZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero)
     * @return {boolean}             : true if command sent, false if not
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
        return sendTankCommand(leftValue, rightValue);
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
     * @return {boolean}          : true if command sent, false if not
     */
    function sendTankCommand(
        leftValue, rightValue,  
        leftFlip = false, rightFlip = false,    
        leftZero = 0, rightZero = 0)    
    {
        // a zero (stop) command is high priority
        const tankCommand = formatTankCommand(leftValue, rightValue, leftFlip, rightFlip, leftZero, rightZero);
        return enqueueCommand(tankCommand, (abs(leftValue) <= leftZero) && (abs(rightValue) <= rightZero));
    }

    /**
     * Send a halt command to the rover
     */
    function sendHaltCommand() {
        // clear command buffer, make halt next command
        _commandQueue = [];
        return enqueueCommand("halt()", true);
    }

    /**
     * Send a string command to the rover
     * - the command get's wrapped in a cmd() wrapper with a serial number
     * 
     * @param {string} commandString 
     * @return {boolean} true if command sent, false if not
     */
    function sendCommand(commandString)    
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


    /**
     * Send a tank-style (left wheel, right wheel) command to the rover.
     * Wheel values (-1.0..1.0) are used to scale output values against maximums.
     * If using speed control, then values of (0..maxSpeed) are output.
     * If not using speed control, then pwm values of (0..255) are output.
     * 
     * @param {number} leftValue  : float: joystick axis value -1.0 to 1.0
     * @param {number} rightValue : float: joystick axis value -1.0 to 1.0
     * @param {boolean} leftFlip  : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {boolean} rightFlip : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {number} leftZero   : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @param {number} rightZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     */
    function formatTankCommand(
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
                leftCommandValue = map(abs(leftValue), leftZero, 1.0, _minSpeed, _maxSpeed).toFixed(4);
            } else { 
                // map axis value from stallValue to max engine value (255)
                leftCommandValue = int(map(abs(leftValue), leftZero, 1.0, int(_leftStall * 255), 255));
            }
        }
        let rightCommandValue = 0; 
        if(abs(rightValue) > rightZero) {
            if(_useSpeedControl) {
                // map axis value from minSpeed to maxSpeed
                rightCommandValue = map(abs(rightValue), rightZero, 1.0, _minSpeed, _maxSpeed).toFixed(4);
            } else {
                // map axis value from stallValue to max engine value (255)
                rightCommandValue = int(map(abs(rightValue), rightZero, 1.0, int(_rightStall * 255), 255));
            }
        }

        
        // format command
        if(_useSpeedControl) {
            return `speed(${leftCommandValue}, ${leftValue >= 0}, ${rightCommandValue}, ${rightValue >= 0})`;
        } else {
            return `pwm(${leftCommandValue}, ${leftValue >= 0}, ${rightCommandValue}, ${rightValue >= 0})`;
        }
    }

    //
    // command queue
    //
    let _commandQueue = [];
    let _highPriorityQueue = false;  // true if queue should only have high priority commands
    /**
     * Insert a command into the command queue.
     * If the command is high priority, all low
     * priority commands are removed from the 
     * queue and no low priority commands will
     * be queued until all high priority commands 
     * are sent.
     * 
     * @param {string} command : command to queue
     * @param {boolean} highPriority: the command is high priority
     * @param {boolean}        : true if command queued, 
     *                           false if not
     */
    function enqueueCommand(command, highPriority=false) {
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

    /**
     * Send the next command in the command queue.
     * 
     * @returns {boolean} : true if a command was sent
     *                      false is command was not sent
     */
    function processCommands() {
        if(_commandQueue.length > 0) {
            const command = _commandQueue.shift();
            if(typeof command == "string") {
                if(sendCommand(command)) {
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

    let lastTurtleCommand = ""

    // 
    // send the next command in the command queue
    //
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

    const self = {
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
        "enqueueTurtleCommand": enqueueTurtleCommand,
        "processTurtleCommand": processTurtleCommand,
        "sendTurtleCommand": sendTurtleCommand,
        "sendJoystickCommand": sendJoystickCommand,
        "sendTankCommand": sendTankCommand,
        "sendHaltCommand": sendHaltCommand,
        "syncSpeedControl": syncSpeedControl,
        "syncMotorStall": syncMotorStall
    }

    return self;
}