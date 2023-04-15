/// <reference path="message_bus.js" />

/**
 * @summary A model that can be updated with telemetry data.
 * 
 * @typedef {object} TelemetryModelType
 * @property {(key: string) => any} get
 * @property {(key: string, value: any) => void} set
 * @property {() => void} reset
 */

/**
 * @typedef {object} TelemetryModelListenerType
 * @property {() => string | undefined} specifier
 * @property {() => string} message
 * @property {() => TelemetryModelListenerType} reset
 * @property {() => boolean} isListening
 * @property {() => TelemetryModelListenerType} startListening
 * @property {() => TelemetryModelListenerType} stopListening
 * @property {(msg: string, data: any, spec?: string | undefined) => void} onMessage
 */

/**
 * @summary Listen for telmetry changes and update model base on them.
 * @description Listen for telemetry and pulls data from it based on 
 *              the specifier.  The resulting telemetry data is then
 *              set into the model.
 *              The model must have the following methods;
 *              - get(key)
 *              - set(key, value)
 *              - reset()
 * 
 * @param {MessageBusType} messageBus 
 * @param {string} msg 
 * @param {string|undefined} spec 
 * @param {TelemetryModelType} model 
 * @returns {TelemetryModelListenerType}
 */
function TelemetryModelListener(messageBus, msg, spec, model) {
    let _listening = 0;

    //
    // model must have get, set and reset methods
    //
    if(!(model.hasOwnProperty("set") && 
        (typeof model.set === "function") &&
        model.hasOwnProperty("get") &&
        (typeof model.get === "function") &&
        model.hasOwnProperty("reset") &&
        (typeof model.reset === "function")))
    {
        throw TypeError("model must have get, set and reset methods.");
    }

    /**
     * Get the message specifier key to listen for.
     * This specifieS a field in the message that 
     * contains the telemetry data we desire.
     * 
     * @returns {string|undefined}
     */
    function specifier() {
        return spec;
    }

    /**
     * Get the message to listen for.
     * 
     * @returns {string}
     */
    function message() {
        return msg;
    }

    /**
     * Determine if we started listening for telemetry.
     * 
     * @returns {boolean} true if listening, false if not.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for telemetry messages.
     * 
     * @description
     * Start listening for telemetry messages 
     * with the given message name.  When a
     * message is received then it is added to the 
     * buffer; if there is a specifier then
     * that is used as a field name to pull
     * the telemetry object from the message,
     * if there is not specifier then the
     * entire message is saved.
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
     * @returns {TelemetryModelListenerType}  // RET: self for fluent chained api calls
     */
    function startListening() {
        if(1 == (_listening += 1)) {
            messageBus.subscribe(message(), self);
        }

        return self;
    }

    /**
     * @summary Stop listening for telemetry messages.
     * 
     * @description
     * Stop listening for telemetry messages
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
     * @returns {TelemetryModelListenerType}  // RET: self for fluent chained api calls
     */
    function stopListening() {
        if(0 == (_listening -= 1)) {
            messageBus.unsubscribe(message(), self);
        }

        return self;
    }

    /**
     * @summary Handle a telemetry message.
     * 
     * @description
     * This pulls out the telemetry, saves
     * it in the model, then if a message bus
     * was provided it publishes a message
     * indicating the data was updated.
     * 
     * @param {string} msg 
     * @param {any} data 
     * @param {string|undefined} spec 
     */
    function onMessage(msg, data, spec = undefined) {
        if(message() === msg) {
            if(data.hasOwnProperty(specifier())) {
                //
                // copy fields into model
                //
                for(const [key, value] of Object.entries(data[specifier()])) {
                    model.set(key, value);
                }

                // publish update message with reference to this telemetry buffer.
                if(messageBus) {
                    messageBus.publish(`${msg}-update`, self);
                }
            }
        }
    }


    /**
     * @summary Reset the model to defaults.
     * 
     * @description
     * Reset the model to defaults and
     * send update message if message bus 
     * is provided.
     * 
     * @returns {TelemetryModelListenerType}  // RET: self for fluent chained api calls
     */
    function reset() {
        model.reset();

        // publish update message with reference to this telemetry buffer.
        if(messageBus) {
            messageBus.publish(`${message()}-update`, self);
        }
        return self;
    }

 
    /** @type {TelemetryModelListenerType} */
    const self = Object.freeze({
        "message": message,
        "specifier": specifier,
        "reset": reset,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    });

    return self;
}

