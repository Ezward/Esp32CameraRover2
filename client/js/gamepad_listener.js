// import MessageBus from './message_bus.js'

/**
 * Listen for gamepadconnected and gamepaddisconnected events
 * and republush them on the given message bus
 */
function GamepadListener(messageBus) {
    if (!messageBus) throw new Error("messageBus must be provided");

    window.addEventListener("gamepadconnected", _onGamepadConnected);
    window.addEventListener("gamepaddisconnected", _onGamepadDisconnected);

    let gamePadCount = 0;

    function getConnectedCount() {
        return gamePadCount;
    }

    /**
     * When a gamepad is connected, update the gamepad config UI
     * 
     * @param {*} event 
     */
    function _onGamepadConnected(event) {
        console.log(`Connected ${event.gamepad.id} at index ${event.gamepad.index}`);
        gamePadCount += 1;

        // publish message that gamepad list has changed
        if (messageBus) {
            messageBus.publish("gamepadconnected", event.gamepad);
        }
    }

    /**
     * Called when a gamepad is disconnected.
     * Update the list of connected gamepads and
     * if the selected gamepad is the one being
     * disconnected, then reset the selection.
     * 
     * @param {*} event 
     */
    function _onGamepadDisconnected(event) {
        console.log(`Disconnected ${event.gamepad.id} at index ${event.gamepad.index}`);
        gamePadCount -= 1;

        // publish message that gamepad list has changed
        if (messageBus) {
            messageBus.publish("gamepaddisconnected", event.gamepad);
        }
    }

    const exports = {
        "getConnectedCount": getConnectedCount,
    }

    return exports;
}
