/// <reference path="command_socket.js" />

/** @typedef {'stop'|'forward'|'reverse'|'left'|'right'} TurtleCommandName */

/**
 * @summary A rover command processor.
 * @description
 * This maintains a queue of command to send 
 * and will send one per animation frame until
 * the queue is empty or an error occurs.  Senders
 * can subscribe to messages to track the status
 * of their commands; this is important because
 * errors must be cleared before the rest of
 * the queue can be processed.
 * This has functions to:
 * - format commands
 * - queue commands
 * - send commands to rover.
 * - clear errors
 * - reset the queue and/or websocket
 * 
 * @typedef {object} RoverCommanderType
 * @property {() => boolean} isStarted
 * @property {() => RoverCommanderType} start
 * @property {() => RoverCommanderType} stop
 * @property {() => boolean} isReady
 * @property {() => boolean} isSending
 * @property {() => string} getSending
 * @property {() => boolean} hasError
 * @property {() => string} getError
 * @property {() => RoverCommanderType} clear
 * @property {() => RoverCommanderType} reset
 * @property {() => void} halt
 * @property {(wheels: number, 
 *             useSpeedControl: boolean, 
 *             minSpeed: number, maxSpeed: number, 
 *             Kp: number, Ki: number, Kd: number) 
 *             => void} syncSpeedControl
 * @property {(motorOneStall: number, motorTwoStall: number) => void} syncMotorStall
 * @property {(throttleValue: number, steeringValue: number, 
 *             throttleFlip: boolean, steeringFlip: boolean, 
 *             throttleZero: number, steeringZero: number) 
 *             => boolean} sendJoystickCommand
 * @property {(leftValue: number, rightValue: number, 
 *             leftFlip?: boolean, rightFlip?: boolean, 
 *             leftZero?: number, rightZero?: number) 
 *             => boolean} sendTankCommand
 * @property {() => boolean} sendHaltCommand
 * @property {() => boolean} sendResetPoseCommand
 * @property {(x: number, y: number, tolerance: number, pointForward: number) => boolean} sendGotoGoalCommand
 * @property {(command: TurtleCommandName, speedPercent: number) => void} enqueueTurtleCommand
 * @property {() => void} processTurtleCommand
 * @property {(command: TurtleCommandName, speedFraction: number) => boolean} sendTurtleCommand
 */

/**
 * @summary Construct a rover command processor.
 * @description
 * This maintains a queue of command to send 
 * and will send one per animation frame until
 * the queue is empty or an error occurs.  The
 * command processor takes a command socket as
 * a dependency; the command socket with publish
 * messages regarding the status of messages,
 * so the sender can determine if their command
 * succeeded or failed.
 * Errors must be cleared before the rest of
 * the queue can be processed.
 * This has functions to:
 * - format commands
 * - queue commands
 * - send commands to rover.
 * - clear errors
 * - reset the queue and/or websocket
 * 
 * @param {string} host 
 * @param {CommandSocketType} commandSocket 
 * @returns {RoverCommanderType}
 */
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

    /**
     * @summary Determine if rover commander is running.
     * 
     * @returns {boolean}
     */
    function isStarted() {
        return _started;
    }

    let _requestAnimationFrameNumber = 0;

    /**
     * @summary Start processing commands.
     * @description
     * Start the command processing loop.  
     * 
     * @returns {RoverCommanderType} // RET: this command processor for fluent chain calling.
     */
    function start() {
        _started = true;
        _requestAnimationFrameNumber = window.requestAnimationFrame(_processingLoop);
        return self;
    }

    /**
     * @summary Stop processing commands.
     * @description
     * Stop the command processing loop.
     * 
     * @returns {RoverCommanderType} // RET: this command processor for fluent chain calling.
     */
    function stop() {
        _started = false;
        window.cancelAnimationFrame(_requestAnimationFrameNumber);
        return self;
    }

    /**
     * @summary Start the processing loop.
     * @description
     * While isStarted() is true, this will be 
     * called on each animation frame to process the command queue.
     * 
     * @param {number} timeStamp 
     */
    function _processingLoop(timeStamp) {
        _processCommands();
        if (isStarted()) {
            window.requestAnimationFrame(_processingLoop);
        }
    }

    /**
     * @summary Determine if command socket is ready.
     * @returns {boolean}
     */
    function isReady() {
        return commandSocket && commandSocket.isReady();
    }

    /**
     * @summary Determine if command is sending but not acknowledged.
     * 
     * @description
     * While a command is being sent, but not yet acknowledged, 
     * isSending() is true and getSending() is the command.
     * 
     * @returns {boolean}
     */
    function isSending() {
        return commandSocket && commandSocket.isSending();
    }

    /**
     * @summary Get the sending command.
     * 
     * @description
     * While a command is being sent, but not yet acknowledged, 
     * isSending() is true and getSending() is the command.
     * 
     * @returns {string} // RET: command if isSending() is true,
     *                           otherwise the blank string.
     */
    function getSending() {
        return commandSocket ? commandSocket.getSending() : "";
    }

    /**
     * @summary Determine if command has errored.
     * 
     * @description
     * If a sent command is not acknowledged, then
     * hasError() becomes true and getError() is the error
     * message returned by the server in an 'ERROR()' frame.
     * 
     * @returns {boolean}
     */
    function hasError() {
        return commandSocket && commandSocket.hasError();
    }

    /**
     * @summary Get command error.
     * 
     * @description
     * If a sent command is not acknowledged, then
     * hasError() becomes true and getError() is the error
     * message returned by the server in an 'ERROR()' frame.
     * 
     * @returns {string} // RET: if hasError() is true then the error message
     *                           otherwise the blank string.
     */
    function getError() {
        return commandSocket ? commandSocket.getError() : "";
    }

    /**
     * @summary clear the sending error state
     * 
     * @description
     * If there is an error, then it must be cleared
     * before any further commands can be sent.
     * This clears the error state if one exists.
     * 
     * @returns {RoverCommanderType} // RET: this command processor for fluent chain calling.
     */
    function clear() {
        if (commandSocket) {
            commandSocket.clearError();
        }
        return self;
    }

    /**
     * @summary Reset the socket connection.
     * 
     * @description
     * This stops the socket and reopens it.
     * Any in-flight command is dropped and
     * any error is cleared.
     * 
     * @returns {RoverCommanderType} // RET: this command processor for fluent chain calling.
     */
    function reset() {
        if (commandSocket) {
            commandSocket.reset();
        }
        return self;
    }

    /**
     * @summary Clear command queue and stop rover.
     * 
     * @description
     * This sends the halt command to the rover,
     * then waits for all pending commands to be processed.
     */
    function halt() {
        sendHaltCommand();
        while(_pendingCommands()) {
            _processCommands()
        }
    }


    /**
     * @summary Set speed control and send it to rover.
     * 
     * @description
     * If we are changing control modes, then first halt the rover, 
     * then send the speed control command.  isSending()
     * and hasError() can be used to check the progress.
     * 
     * @param {number} wheels           // IN : bits designating which wheels this command applies to
     * @param {boolean} useSpeedControl // IN : true if speed control is enabled, false otherwise 
     * @param {number} minSpeed         // IN : minimum measured speed below which motor stalls
     * @param {number} maxSpeed         // IN : maximum measured speed
     * @param {number} Kp               // IN : proportional gain
     * @param {number} Ki               // IN : integral gain
     * @param {number} Kd               // IN : derivative gain
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
            _enqueueCommand(_formatSpeedControlCommand(int(wheels), minSpeed, maxSpeed, Kp, Ki, Kd), true);
        } else {
            // turning off speed control
            _minSpeed = 0;
            _maxSpeed = 0;
        }
    }

    /**
     * Format a speed control command for sending over websocket.
     * 
     * @private
     * @param {number} wheels           // IN : bits designating which wheels this command applies to
     * @param {number} minSpeed         // IN : minimum measured speed below which motor stalls
     * @param {number} maxSpeed         // IN : maximum measured speed
     * @param {number} Kp               // IN : proportional gain
     * @param {number} Ki               // IN : integral gain
     * @param {number} Kd               // IN : derivative gain
     * @returns {string}                // RET: formatted command string
     */
    function _formatSpeedControlCommand(wheels, minSpeed, maxSpeed, Kp, Ki, Kd) {
        return `pid(${wheels}, ${minSpeed}, ${maxSpeed}, ${Kp}, ${Ki}, ${Kd})`;
    }

    /**
     * @summary Send motor stall command. 
     * 
     * @description
     * Format and enqueue a motor stall command
     * to set the fraction of max pwm where the
     * motor will stall.
     * Use isSending() and hasError() to check
     * the progress of the command sending.
     * 
     * @param {number} motorOneStall // 0 to 1 fraction of max pwm
     * @param {number} motorTwoStall // 0 to 1 fraction of max pwm
     */
    function syncMotorStall(motorOneStall, motorTwoStall) {
        // tell the rover about the new speed parameters
        _enqueueCommand(_formatMotorStallCommand(
            _leftStall = motorOneStall, 
            _rightStall = motorTwoStall),
            true    // configuration is high priority command
        );
    }

    /**
     * @summary Format a motor stall command.
     * 
     * @private
     * @param {number} motorOneStall // 0 to 1 fraction of max pwm
     * @param {number} motorTwoStall // 0 to 1 fraction of max pwm
     * @returns {string}             // RET: formatted command string
     */
    function _formatMotorStallCommand(motorOneStall, motorTwoStall) {
        return `stall(${motorOneStall}, ${motorTwoStall})`;
    }

    /**
     * @summary Format a goto goal command.
     * 
     * @param {number} x             // IN : goal x position
     * @param {number} y             // IN : goal y position
     * @param {number} tolerance     // IN : distance from goal for success
     * @param {number} pointForward  // IN : point forward as percentage of wheel base
     * @returns {string}             // RET: formatted command string
     */
    function _formatGotoGoalCommand(x, y, tolerance, pointForward) {
        return `goto(${x}, ${y}, ${tolerance}, ${pointForward})`
    }

    /**
     * @summary Send a turtle-style command to the rover.
     * 
     * @description
     * Send a turtle-style movement command to the rover;
     * stop, forward, reverse, left or right.
     * The command will actually be formatted as a
     * tank-style command and sent to the rover in that format.
     * 
     * @param {TurtleCommandName} command  // 'stop', 'forward', 'reverse', 'left', 'right'
     * @param {number} speedFraction       // float from 0.0 to 1.0, fraction of full throttle
     * @return {boolean}                   // true if command sent, false if not
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
     * @summary Send joystick movement command to the rover.
     * 
     * @description
     * Send a joystick-style movementcommand (throttle, steering) to the rover.
     * 
     * @param {number} throttleValue // float: joystick axis value -1.0 to 1.0
     * @param {number} steeringValue // float: joystick axis value -1.0 to 1.0
     * @param {boolean} throttleFlip // boolean: true to invert axis value, false to use natural axis value
     * @param {boolean} steeringFlip // boolean: true to invert axis value, false to use natural axis value
     * @param {number} throttleZero  // float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero)
     * @param {number} steeringZero  // float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero)
     * @return {boolean}             // true if command sent, false if not
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
     * @summary Send a tank-style movement command to the rover.
     * 
     * @description
     * Send a tank-style (left wheel, right wheel) command to the rover.
     * 
     * @param {number} leftValue  // float: joystick axis value -1.0 to 1.0
     * @param {number} rightValue // float: joystick axis value -1.0 to 1.0
     * @param {boolean} leftFlip  // boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {boolean} rightFlip // boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {number} leftZero   // float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @param {number} rightZero  // float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @return {boolean}          // true if command sent, false if not
     */
    function sendTankCommand(
        leftValue, rightValue,  
        leftFlip = false, rightFlip = false,    
        leftZero = 0, rightZero = 0)    
    {
        // a zero (stop) command is high priority
        const tankCommand = _formatTankCommand(leftValue, rightValue, leftFlip, rightFlip, leftZero, rightZero);
        return _enqueueCommand(tankCommand, (abs(leftValue) <= leftZero) && (abs(rightValue) <= rightZero));
    }

    /**
     * @summary Send a halt command to the rover
     * 
     * @description
     * This will send the halt command to the rover,
     * which will stop the rover and and terminate
     * any running behavior (like goto goal behavior).
     * 
     * @return {boolean} // true if command sent, false if not
     */
    function sendHaltCommand() {
        // clear command buffer, make halt next command
        _commandQueue = [];
        return _enqueueCommand("halt()", true);
    }

    /**
     * @summary Send reset pose command to rover.
     * 
     * @description
     * Send the reset pose command to the rover which 
     * will reset the pose x, y, angle to (0, 0, 0).
     * 
     * @return {boolean} // true if command sent, false if not
     */
    function sendResetPoseCommand() {
        return _enqueueCommand("resetPose()", true);
    }

    /**
     * @summary Send the goto goal movement command to the rover.
     * 
     * @description
     * Send the goto goal movement command to the rover, which
     * will set a target (x, y) position that the rover will 
     * move to, along with a distance tolerance used to decide
     * if the rover has achieved the goal.
     * 
     * @param {number} x             // x position to achieve
     * @param {number} y             // y position to achieve
     * @param {number} tolerance     // distance from goal considered success
     * @param {number} pointForward  // unused
     * @returns 
     */
    function sendGotoGoalCommand(x, y, tolerance, pointForward) {
        return _enqueueCommand(_formatGotoGoalCommand(x, y, tolerance, pointForward));
    }

    /**
     * @summary Send a command string to the server
     * 
     * @description
     * Send a string command to the rover
     * - the command get's wrapped in a cmd() wrapper with a serial number
     * 
     * @private
     * @param {string} commandString 
     * @return {boolean} true if command sent, false if not
     */
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


    /**
     * Send a tank-style (left wheel, right wheel) command to the rover.
     * Wheel values (-1.0..1.0) are used to scale output values against maximums.
     * If using speed control, then values of (0..maxSpeed) are output.
     * If not using speed control, then pwm values of (0..255) are output.
     * 
     * @private
     * @param {number} leftValue  : float: joystick axis value -1.0 to 1.0
     * @param {number} rightValue : float: joystick axis value -1.0 to 1.0
     * @param {boolean} leftFlip  : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {boolean} rightFlip : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {number} leftZero   : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @param {number} rightZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     */
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
    /**
     * Insert a command into the command queue.
     * If the command is high priority, all low
     * priority commands are removed from the 
     * queue and no low priority commands will
     * be queued until all high priority commands 
     * are sent.
     * 
     * @private
     * @param {string} command       // IN : command to queue
     * @param {boolean} highPriority // IN : the command is high priority
     * @return {boolean}             // RET: true if command queued, 
     *                                       false if not
     */
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

    /**
     * @summary Determine if there are any commands in the command queue
     * 
     * @private
     * @returns {boolean} - // RET: true if there is at least one 
     *                      //      command in the command queue.
     *                      //      false if the command queue is empty.
     */
    function _pendingCommands() {
        return _commandQueue.length > 0;
    }

    /**
     * @summary Send the next command in the command queue.
     * 
     * @returns {boolean} : true if a command was sent
     *                      false is command was not sent
     */
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

    /**
     * @summary Add a turtle command to turtle queue.
     * 
     * @description
     * The turtle queue contains a set of turtle
     * command to execute.  As it is processed,
     * each turtle command is formatted into 
     * a tank-style command and added to the 
     * regular command queue where it is actually
     * sent to the rover.
     * 
     * @param {TurtleCommandName} command 
     * @param {number} speedPercent 
     */
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

    /**
     * @summary Process one command from the turtle command queue.
     * 
     * @description
     * This pulls a turtle command from the turtle queue
     * then formats it as a tank-style command and 
     * adds it to the standard command queue, where
     * it will be processed for sending to the rover.
     */
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

    /** @type {RoverCommanderType} */
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
}