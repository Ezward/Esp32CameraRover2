
/**
 * Listen for telmetry changes and update model 
 * base on them.
 * 
 * The model must have the following methods;
 * - get(key)
 * - set(key, value)
 * - reset()
 * 
 * @param {object} messageBus 
 * @param {string} msg 
 * @param {string} spec 
 * @param {object} model 
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

    function specifier() {
        return spec;
    }

    function message() {
        return msg;
    }

    function isListening() {
        return _listening > 0;
    }

    function startListening() {
        if(1 == (_listening += 1)) {
            messageBus.subscribe(message(), self);
        }

        return self;
    }

    function stopListening() {
        if(0 == (_listening -= 1)) {
            messageBus.unsubscribe(message(), self);
        }

        return self;
    }


    function onMessage(msg, data) {
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


    function reset() {
        model.reset();

        // publish update message with reference to this telemetry buffer.
        if(messageBus) {
            messageBus.publish(`${message()}-update`, self);
        }
        return self;
    }

 
    const self = {
        "message": message,
        "specifier": specifier,
        "reset": reset,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    }
    return self;
}

