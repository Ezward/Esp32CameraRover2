// import MessageBus from './message_bus.js'
// import TurtleViewController from './turtle_view_controller.js'
// import TurtleKeyboardController from './turtle_keyboard_controller.js'
// import TankViewController from './tank_view_controller.js'
// import JoystickViewController from './joystick_view_controller.js'


//
// coordinate the state of the view and the associated controllers
//
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

    let listening = 0;

    function startListening() {
        listening += 1;
        if (1 === listening) {
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

    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            messageBus.unsubscribeAll(self);
        }
        return self;
    }

    function isListening() {
        return listening > 0;
    }


    //
    // handle messages from messageBus.
    // In particular, when the TurtleView is activated
    // then start it listening and when it is deactivate
    // then stop it listening
    //
    function onMessage(message, data) {
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

    let _modeLoop = null;
    function _startModeLoop(mode) {
        _stopModeLoop();
        if(!!(_modeLoop = mode)) {
            window.requestAnimationFrame(_modeLoop);
        }
        return self;
    }
    function _stopModeLoop(mode = null) {
        if(_isModeRunning(mode)) {
            window.cancelAnimationFrame(_modeLoop);
            _modeLoop = null;
        }
        return self;
    }
    function _isModeRunning(mode = null) {
        // if there is a loop running and
        // if no specific mode is specified or if specified mode is running
        return (_modeLoop && ((_modeLoop === mode) || !mode));
    }

    let _nextFrame = 0;
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
            window.requestAnimationFrame(_tankModeLoop);
        }
    }

    function _turtleModeLoop(timeStamp) {
        if (_isModeRunning(_turtleModeLoop)) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + FRAME_DELAY_MS;// about 10 frames per second
                roverCommand.processTurtleCommand();    // send next command in command queue
            }
            window.requestAnimationFrame(_turtleModeLoop);
        }
    }

    const self = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "onMessage": onMessage,
    }

    return self;
}
