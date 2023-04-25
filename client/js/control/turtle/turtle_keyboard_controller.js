/// <reference path="../../utilities/message_bus.js" />


const TURTLE_KEY_DOWN = "TURTLE_KEY_DOWN";
const TURTLE_KEY_UP = "TURTLE_KEY_UP";

/**
 * @summary Handle key up/down turtle keys
 * 
 * @typedef {object} TurtleKeyboardControllerType
 * @property {() => boolean} isListening
 * @property {() => TurtleKeyboardControllerType} startListening
 * @property {() => TurtleKeyboardControllerType} stopListening
 */

/**
 * @summary Handle key up/down turtle keys
 * 
 * @description
 * This listens for keyboard events on the turtle control keys
 * and then them into higher level turtle messages and
 * publishes them.  Importantly it prevents the default
 * behavior for keydown, which would cause a key click.
 * 
 * @param {MessageBusType | null} messageBus 
 * @returns {TurtleKeyboardControllerType}
 */
function TurtleKeyboardController(messageBus = null) {
    let _listening = 0;

     /**
     * @summary Start listening for keyboard events.
     * 
     * @description
     * This adds event listeners to the document body.
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
     * @returns {TurtleKeyboardControllerType} this controller instance for fluent chain calling
     */
     function startListening() {
        _listening += 1;
        if (1 === _listening) {
            document.body.addEventListener("keydown", _handleRoverKeyDown);
            document.body.addEventListener("keyup", _handleRoverKeyUp);
        }

        return self
    }

    /**
     * @summary Stop listening for keyboard events.
     * @description
     * This removes event listeners from the document body.
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
     * @returns {TurtleKeyboardControllerType} this controller instance for fluent chain calling
     */
    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            document.body.addEventListener("keydown", _handleRoverKeyDown);
            document.body.addEventListener("keyup", _handleRoverKeyUp);
        }

        return self
    }

    /**
     * @summary Determine if controller is listening for keyboard events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Handle key down events
     * 
     * @description
     * This takes key down events for turtle keys and
     * publishes them as higher level turtle key down messages.
     * 
     * @param {KeyboardEvent} e
     */
    function _handleRoverKeyDown(e) {
        if (e.code == '38') {
            // up arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "forward");
            }
        } else if (e.code == '40') {
            // down arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "reverse");
            }
        } else if (e.code == '37') {
            // left arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "left");
            }
        } else if (e.code == '39') {
            // right arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "right");
            }
        }
    }

    /**
     * @summary Handle key up events
     * 
     * @description
     * This takes key down events for turtle keys and
     * publishes them as higher level turtle key up messages.
     * 
     * @param {KeyboardEvent} e
     */
    function _handleRoverKeyUp(e) {
        if (e.code == '38') {
            // up arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "forward");
            }
        } else if (e.code == '40') {
            // down arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "reverse");
            }
        } else if (e.code == '37') {
            // left arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "left");
            }
        } else if (e.code == '39') {
            // right arrow
            e.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "right");
            }
        }
    }

    const self = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
    }

    return self;
}
