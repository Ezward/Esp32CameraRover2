// import MessageBus from './message_bus.js'
// import TurtleViewController from './turtle_view_controller.js'
// import TurtleKeyboardController from './turtle_keyboard_controller.js'
// import TankViewController from './tank_view_controller.js'
// import JoystickViewController from './joystick_view_controller.js'


//
// coordinate the state of the view and the associated controllers
//
function TelemetryViewManager(messageBus, motorTelemetryViewController, poseTelemetryViewController, resetPoseViewController) {
    if (!messageBus) throw new Error();

    const FRAME_DELAY_MS = 30;

    const MOTOR_ACTIVATED = "TAB_ACTIVATED(#motor-telemetry-container)";
    const MOTOR_DEACTIVATED = "TAB_DEACTIVATED(#motor-telemetry-container)";
    const POSE_ACTIVATED = "TAB_ACTIVATED(#pose-telemetry-container)";
    const POSE_DEACTIVATED = "TAB_DEACTIVATED(#pose-telemetry-container)";

    let listening = 0;

    function startListening() {
        listening += 1;
        if (1 === listening) {
            messageBus.subscribe(MOTOR_ACTIVATED, self);
            messageBus.subscribe(MOTOR_DEACTIVATED, self);
            messageBus.subscribe(POSE_ACTIVATED, self);
            messageBus.subscribe(POSE_DEACTIVATED, self);
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
    // In particular, when the a tab is activated
    // then start it's controller listening 
    // and when it is deactivate then stop it's controller listening
    //
    function onMessage(message, data) {
        switch (message) {
            case MOTOR_ACTIVATED: {
                if (motorTelemetryViewController && !motorTelemetryViewController.isListening()) {
                    motorTelemetryViewController.startListening();
                    messageBus.publish("telemetry-update"); // for update of telemetry canvas
                }
                return;
            }
            case MOTOR_DEACTIVATED: {
                if (motorTelemetryViewController && motorTelemetryViewController.isListening()) {
                    motorTelemetryViewController.stopListening();
                }
                return;
            }
            case POSE_ACTIVATED: {
                if (poseTelemetryViewController && !poseTelemetryViewController.isListening()) {
                    poseTelemetryViewController.startListening();
                    resetPoseViewController.startListening();
                    messageBus.publish("pose-update"); // for update of pose canvas
                }
                return;
            }
            case POSE_DEACTIVATED: {
                if (poseTelemetryViewController && poseTelemetryViewController.isListening()) {
                    poseTelemetryViewController.stopListening();
                    resetPoseViewController.stopListening();
                }
                return;
            }
            default: {
                console.log("TelemetryViewManager unhandled message: " + message);
            }

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
