/// <reference path="message_bus.js" />
/// <reference path="turtle_view_controller.js" />
/// <reference path="turtle_keyboard_controller.js" />
/// <reference path="gamepad_view_controller.js" />

/**
 * @typedef {object} RoverViewManagerType
 * @property {() => RoverViewManagerType} startListening
 * @property {() => RoverViewManagerType} stopListening
 * @property {() => boolean} isListening
 * @property {onMessageFunction} onMessage
 */

/**
 * @summary coordinate the motion/command controllers
 * 
 * @description
 * This manages the various view controllers;
 * - turtleViewController
 * - turtleKeyboardControl
 * - tankViewController
 * - joystickViewController
 * - gotoGoalViewController
 * 
 * @param {RoverCommanderType} roverCommand 
 * @param {MessageBusType} messageBus 
 * @param {TurtleViewControllerType} turtleViewController 
 * @param {TurtleKeyboardControllerType} turtleKeyboardControl 
 * @param {GamePadViewControllerType} tankViewController 
 * @param {GamePadViewControllerType} joystickViewController 
 * @param {GotoGoalViewControllerType} gotoGoalViewController 
 * @returns {RoverViewManagerType}
 */
function RoverViewManager(
    roverCommand, 
    messageBus, 
    turtleViewController, 
    turtleKeyboardControl, 
    tankViewController, 
    joystickViewController, 
    gotoGoalViewController) 
{
    if (!messageBus) throw new Error();

    const FRAME_DELAY_MS = 30;

    const TURTLE_ACTIVATED = "TAB_ACTIVATED(#turtle-control)";
    const TURTLE_DEACTIVATED = "TAB_DEACTIVATED(#turtle-control)";
    const TANK_ACTIVATED = "TAB_ACTIVATED(#tank-control)";
    const TANK_DEACTIVATED = "TAB_DEACTIVATED(#tank-control)";
    const JOYSTICK_ACTIVATED = "TAB_ACTIVATED(#joystick-control)";
    const JOYSTICK_DEACTIVATED = "TAB_DEACTIVATED(#joystick-control)";
    const GOTOGOAL_ACTIVATED = "TAB_ACTIVATED(#goto-goal-control)";
    const GOTOGOAL_DEACTIVATED = "TAB_DEACTIVATED(#goto-goal-control)";

    let _listening = 0;

    /**
     * @summary Start listening for messages.
     * 
     * @description
     * This subscribes to messages from the underlying view controllers
     * so that it an coordinate them.
     * 
     * >> NOTE: This keeps count of calls to start/stop and balances multiple calls;
     * 
     * @example
     * ```
     * startListening() // true === isListening()
     * startListening() // true === isListening()
     * stopListening()  // true === isListening()
     * stopListening()  // false === isListening()
     * ```
     * 
     * @returns {RoverViewManagerType} // this manager, for fluent chain calling.
     */
    function startListening() {
        _listening += 1;
        if (1 === _listening) {
            messageBus.subscribe(TURTLE_ACTIVATED, self);
            messageBus.subscribe(TURTLE_DEACTIVATED, self);
            messageBus.subscribe(TANK_ACTIVATED, self);
            messageBus.subscribe(TANK_DEACTIVATED, self);
            messageBus.subscribe(JOYSTICK_ACTIVATED, self);
            messageBus.subscribe(JOYSTICK_DEACTIVATED, self);
            messageBus.subscribe(GOTOGOAL_ACTIVATED, self);
            messageBus.subscribe(GOTOGOAL_DEACTIVATED, self);
        }
        return self;
    }

    /**
     * @summary Stop listening for messages.
     * 
     * @description
     * This unsubscribes from messages from the underlying view controllers.
     * 
     * >> NOTE: This keeps count of calls to start/stop and balances multiple calls;
     * 
     * @example
     * ```
     * startListening() // true === isListening()
     * startListening() // true === isListening()
     * stopListening()  // true === isListening()
     * stopListening()  // false === isListening()
     * ```
     * 
     * @returns {RoverViewManagerType} // this manager, for fluent chain calling.
     */
    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            messageBus.unsubscribeAll(self);
        }
        return self;
    }

    /**
     * @summary Determine if we are listening for messages.
     * 
     * @description
     * This is based on an count that is incremented by
     * startListening() and descremented by stopListening().
     * 
     * @example
     * >> NOTE: This keeps count of calls to start/stop and balances multiple calls;
     * 
     * @example
     * ```
     * startListening() // true === isListening()
     * startListening() // true === isListening()
     * stopListening()  // true === isListening()
     * stopListening()  // false === isListening()
     * ```
     * 
     * @returns {boolean}
     */
    function isListening() {
        return _listening > 0;
    }


    /**
     * @summary handle messages from messageBus
     * 
     * @description
     * Use published messages from the managed view
     * in order to coordinate them.
     * In particular, when the TurtleView is activated
     * then start it listening and when it is deactivate
     * then stop it listening.
     * >> CAUTION: this should not be called directly;
     *    only the message but should call it.
     * 
     * @type {onMessageFunction}
     */
    function onMessage(message, data, specifier=undefined) {
        switch (message) {
            case TURTLE_ACTIVATED: {
                if (turtleViewController && !turtleViewController.isListening()) {
                    turtleViewController.startListening();
                }
                if (turtleKeyboardControl && !turtleKeyboardControl.isListening()) {
                    turtleKeyboardControl.startListening();
                }
                _startModeLoop(_turtleModeLoop);
                return;
            }
            case TURTLE_DEACTIVATED: {
                if (turtleViewController && turtleViewController.isListening()) {
                    turtleViewController.stopListening();
                }
                if (turtleKeyboardControl && turtleKeyboardControl.isListening()) {
                    turtleKeyboardControl.stopListening();
                }
                _stopModeLoop(_turtleModeLoop);
                return;
            }
            case TANK_ACTIVATED: {
                if (tankViewController && !tankViewController.isListening()) {
                    tankViewController.updateView(true).startListening();
                }
                _startModeLoop(_tankModeLoop);
                return;
            }
            case TANK_DEACTIVATED: {
                if (tankViewController && tankViewController.isListening()) {
                    tankViewController.stopListening();
                }
                _stopModeLoop(_tankModeLoop);
                return;
            }
            case JOYSTICK_ACTIVATED: {
                if (joystickViewController && !joystickViewController.isListening()) {
                    joystickViewController.updateView(true).startListening();
                }
                _startModeLoop(_joystickModeLoop);
                return;
            }
            case JOYSTICK_DEACTIVATED: {
                if (joystickViewController && joystickViewController.isListening()) {
                    joystickViewController.stopListening();
                }
                _stopModeLoop(_joystickModeLoop);
                return;
            }
            case GOTOGOAL_ACTIVATED: {
                if (gotoGoalViewController && !gotoGoalViewController.isListening()) {
                    gotoGoalViewController.updateView(true).startListening();
                }
                return;
            }
            case GOTOGOAL_DEACTIVATED: {
                if (gotoGoalViewController && gotoGoalViewController.isListening()) {
                    gotoGoalViewController.stopListening();
                }
                return;
            }
            default: {
                console.log("TurtleViewController unhandled message: " + message);
            }

        }
    }

    /** @typedef {(number) => void} CommandModeLoop  */
    /** @type {CommandModeLoop | null} */
    let _modeLoop = null; // the command loop for the active command mode.
    let _requestAnimationFrameNumber = 0;

    /**
     * @private
     * @summary Start a command mode running.
     * 
     * @description
     * If a command loop is already running 
     * then it is stopped and the new command loop
     * is started.
     * 
     * @param {CommandModeLoop | null} mode 
     * @returns {RoverViewManagerType} // this manager, for fluent chain calling.
     */
    function _startModeLoop(mode) {
        _stopModeLoop();
        if(!!(_modeLoop = mode)) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_modeLoop);
        }
        return self;
    }

    /**
     * @private
     * @summary Stop the given command mode if it is running.
     * 
     * @param {CommandModeLoop | null} mode 
     * @returns {RoverViewManagerType} // this manager, for fluent chain calling.
     */
    function _stopModeLoop(mode = null) {
        if(_isModeRunning(mode)) {
            window.cancelAnimationFrame(_requestAnimationFrameNumber);
            _modeLoop = null;
        }
        return self;
    }

    /**
     * @private
     * @summary Determine if the given command mode is running.
     * @param {CommandModeLoop | null} mode 
     * @returns {boolean}
     */
    function _isModeRunning(mode = null) {
        // if there is a loop running and
        // if no specific mode is specified or if specified mode is running
        return (_modeLoop && ((_modeLoop === mode) || !mode));
    }

    let _nextFrame = 0;

    /**
     * @private
     * @summary Joystick command mode loop.
     * 
     * @description
     * When active this sends a joystick command
     * once per animation frame
     * to the rover based on the current joystick values.
     * 
     * @param {number} timeStamp 
     */
    function _joystickModeLoop(timeStamp) {
        if (_isModeRunning(_joystickModeLoop)) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + FRAME_DELAY_MS;    // about 10 frames per second
                if(joystickViewController) {
                    roverCommand.sendJoystickCommand(
                        joystickViewController.getAxisOneValue(),
                        joystickViewController.getAxisTwoValue(),
                        joystickViewController.getAxisOneFlip(),
                        joystickViewController.getAxisTwoFlip(),
                        joystickViewController.getAxisOneZero(),
                        joystickViewController.getAxisTwoZero()
                    );
                }
            }
            window.requestAnimationFrame(_joystickModeLoop);
        }
    }

    /**
     * @private
     * @summary The tank command mode loop
     * @description
     * This will send on tank command per animation frame
     * based on the current state of the tank view controller.
     * 
     * @param {number} timeStamp 
     */
    function _tankModeLoop(timeStamp) {
        if (_isModeRunning(_tankModeLoop)) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + FRAME_DELAY_MS;    // about 10 frames per second
                if(tankViewController) {
                    roverCommand.sendTankCommand(
                        tankViewController.getAxisOneValue(),
                        tankViewController.getAxisTwoValue(),
                        tankViewController.getAxisOneFlip(),
                        tankViewController.getAxisTwoFlip(),
                        tankViewController.getAxisOneZero(),
                        tankViewController.getAxisTwoZero()
                    );
                }
            }
            _requestAnimationFrameNumber = window.requestAnimationFrame(_tankModeLoop);
        }
    }

    /**
     * @private
     * @summary The turtle command mode loop.
     * @description
     * This processes one turtle command per animation frame.
     * 
     * @param {number} timeStamp 
     */
    function _turtleModeLoop(timeStamp) {
        if (_isModeRunning(_turtleModeLoop)) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + FRAME_DELAY_MS;// about 10 frames per second
                roverCommand.processTurtleCommand();    // send next command in command queue
            }
            _requestAnimationFrameNumber = window.requestAnimationFrame(_turtleModeLoop);
        }
    }

    /** @type {RoverViewManagerType} */
    const self = Object.freeze({
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "onMessage": onMessage,
    });

    return self;
}
