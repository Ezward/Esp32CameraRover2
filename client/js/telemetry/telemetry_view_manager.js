/// <reference path="../utilities/message_bus.js" />
/// <reference path="../view/widget/canvas/canvas_view_controller.js" />
/// <reference path="../control/turtle/turtle_view_controller.js" />
/// <reference path="../control/turtle/turtle_keyboard_controller.js" />
/// <reference path="../control/joystick/gamepad_view_controller.js" />


/**
 * @summary View controller to coordinate telemetry tabs and reset buttons.
 * 
 * @typedef {object} TelemetryViewManagerType
 * @property {() => boolean} isListening
 * @property {() => TelemetryViewManagerType} startListening
 * @property {() => TelemetryViewManagerType} stopListening
 * @property {(message: string, data: any, specifier: string) => void} onMessage
 */


/**
 * @summary Construct a view controller to coordinate telemetry tabs and reset buttons.
 * 
 * @param {MessageBusType} messageBus 
 * @param {CanvasViewControllerType} motorTelemetryViewController 
 * @param {ResetTelemetryViewControllerType} resetTelemetryViewController 
 * @param {CanvasViewControllerType} poseTelemetryViewController 
 * @param {ResetTelemetryViewControllerType} resetPoseViewController 
 * @returns {TelemetryViewManagerType}
 */
function TelemetryViewManager(
    messageBus, 
    motorTelemetryViewController, 
    resetTelemetryViewController, 
    poseTelemetryViewController, 
    resetPoseViewController) 
{
    // we must have a message bus
    if (!messageBus) throw new Error();

    const FRAME_DELAY_MS = 30;

    const MOTOR_ACTIVATED = "TAB_ACTIVATED(#motor-telemetry-container)";
    const MOTOR_DEACTIVATED = "TAB_DEACTIVATED(#motor-telemetry-container)";
    const POSE_ACTIVATED = "TAB_ACTIVATED(#pose-telemetry-container)";
    const POSE_DEACTIVATED = "TAB_DEACTIVATED(#pose-telemetry-container)";

    let listening = 0;

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
     * @returns {TelemetryViewManagerType} // this manager, for fluent chain calling.
     */
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
     * @returns {TelemetryViewManagerType} // this manager, for fluent chain calling.
     */
    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            messageBus.unsubscribeAll(self);
        }
        return self;
    }

    /**
     * @summary Determine if we are listening for messages.
     * 
     * @description
     * This is based on an count that is incremented by
     * startListening() and decremented by stopListening().
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
        return listening > 0;
    }

    /**
     * @summary handle messages from messageBus
     * 
     * @description
     * Use published messages from the managed view
     * in order to coordinate them.
     * In particular, when a tab is activated
     * then start it listening and when it is deactivate
     * then stop it listening.
     * >> CAUTION: this should not be called directly;
     *    only the message but should call it.
     * 
     * @type {onMessageFunction}
     */
    function onMessage(message, data, specifier = undefined) {
        switch (message) {
            case MOTOR_ACTIVATED: {
                if (motorTelemetryViewController && !motorTelemetryViewController.isListening()) {
                    motorTelemetryViewController.startListening();
                    resetTelemetryViewController.startListening();
                    messageBus.publish("telemetry-update"); // for update of telemetry canvas
                }
                return;
            }
            case MOTOR_DEACTIVATED: {
                if (motorTelemetryViewController && motorTelemetryViewController.isListening()) {
                    motorTelemetryViewController.stopListening();
                    resetTelemetryViewController.stopListening();
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

    /** @typedef {TelemetryViewManagerType} */
    const self = Object.freeze({
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "onMessage": onMessage,
    });

    return self;
}
