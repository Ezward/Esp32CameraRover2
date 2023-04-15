
/// <reference path="message_bus.js" />
/// <reference path="message_bus.js" />

/**
 * A telemetry value for a single wheel.
 * 
 * @typedef {object} WheelTelemetryType
 * @property {boolean} forward // true if wheel is moving forward
 * @property {number} pwm      // current pwm value for wheel's motor
 * @property {number} target   // target linear velocity in meters/second
 * @property {number} speed    // actual linear velocity in meters/second
 * @property {number} distance // distance travelled in meters
 * @property {number} at       // timestamp
 */

/**
 * A telemetry value for robot pose.
 * 
 * @example
 * `{pose: {x: 10.1, y: 4.3, a: 0.53, at:1234567890}`
 * 
 * @typedef {object} PoseTelemetryType
 * @property {number} x   // x position in meters
 * @property {number} y   // y position in meters
 * @property {number} a   // orientation (angle in radians)
 * @property {number} at  // timestamp
 * 
 */

/**
 * Telemetry values always have a timestamp in 'at' field.
 * 
 * @typedef {object & {at: number}} TelemetryType
 */

/**
 * Iterator for telemetry listener's buffer.
 * 
 * @typedef {object} TelemetryIteratorType
 * @property {() => boolean} hasNext
 * @property {() => TelemetryType} next
 */

/**
 * Interface for a telemetry listener.
 * 
 * @typedef {object} TelemetryListenerType
 * @property {() => string} message      // message to listen for
 * @property {() => string} specifier    // message field to process
 * @property {() => boolean} isListening // true if listening
 * @property {() => TelemetryListenerType} startListening
 * @property {() => TelemetryListenerType} stopListening
 * @property {(msg: string, data: any, field_specifier?: string) => void} onMessage
 * @property {() => number} capacity
 * @property {() => number} count
 * @property {() => TelemetryListenerType} reset
 * @property {() => TelemetryType} first
 * @property {() => TelemetryType} last
 * @property {(key: string, defaultValue?: number) => number} minimum
 * @property {(key: string, defaultValue?: number) => number} maximum
 * @property {(i: number) => TelemetryType} get
 * @property {(timeStamp: number) => TelemetryListenerType} trimBefore
 * @property {() => TelemetryIteratorType} iterator
 */

/**
 * Construct a Telemetry listener that listens
 * for incoming telemetry and saves it in a
 * buffer.
 * 
 * example telemetry:
 * ```
 * {
 *   "left":{
 *     "forward":true,
 *     "pwm":237,
 *     "target":88.930000,
 *     "speed":92.000000,
 *     "distance":227.000000,
 *     "at":2140355
 *   }
 * }
 * ```
 * 
 * @param {MessageBusType} messageBus // IN : message bus use to listen for telemetry messages
 * @param {string} msg                // IN : the message to listen for.
 * @param {string} spec               // IN : the message specifier to listen for.
 * @param {number} maxHistory         // IN : the maximum number of messages in telemetry buffer.
 * @returns {TelemetryListenerType}
 */
function TelemetryListener(messageBus, msg, spec, maxHistory) {
    /** @type {TelemetryType[]} */
    let _telemetry = [];

    let _listening = 0;

    /** @type {Object.<string, number>} */
    let _minimum = {};

    /** @type {Object.<string, number>} */
    let _maximum = {};

    /**
     * Get the message specifier key to listen for.
     * This specified a field in the message that 
     * contains the telemetry data we desire.
     * 
     * @returns {string}
     */
    function specifier() {
        return spec;
    }

    /**
     * Get the message to listen for.
     * @returns {string}
     */
    function message() {
        return msg;
    }

    /**
     * Determine if we started listening
     * @returns {boolean} true if listening, false if not.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * Start listening form telemetry messages 
     * with the msg and spec passed to constructor 
     * and returned by message() and specifier()
     * respectively.
     * 
     * NOTE: This can be called more than once.  Each
     *       call to startListening() must be matched 
     *       with a call to stopListening() in order
     *       to actually halt listening.
     * 
     * @returns {TelemetryListenerType}  // RET: self for fluent chained api calls
     */
    function startListening() {
        if(1 == (_listening += 1)) {
            messageBus.subscribe(message(), self);
        }

        return self;
    }

    /**
     * 
     * @returns {TelemetryListenerType}  // RET: self for fluent chained api calls
     */
    function stopListening() {
        if(0 == (_listening -= 1)) {
            messageBus.unsubscribe(message(), self);
        }

        return self;
    }

    /**
     * Maintain the minimum value for the given key.
     * 
     * NOTE: this only maintains number values
     * 
     * @param {string} key 
     * @param {number} value 
     */
    function _maintainMinimum(key, value) {
        if(typeof value === "number") {
            if(typeof _minimum[key] === "number") {
                if(value < _minimum[key]) {
                    _minimum[key] = value;
               }
            } else {
                _minimum[key] = value;
            }
        }
    }

    /**
     * Maintain the maximum value for the given key.
     * 
     * NOTE: this only maintains number values
     * 
     * @param {string} key 
     * @param {number} value 
     */
    function _maintainMaximum(key, value) {
        if(typeof value === "number") {
            if(typeof _maximum[key] === "number") {
                if(value > _maximum[key]) {
                    _maximum[key] = value;
                }
            } else {
                _maximum[key] = value;
            }
        }
    }


    /**
     * Handle a telemetry message.  
     * If the message matches the one we are listening for,
     * the check the data for the specifier key we are looking for.
     * If both of those match the save the message in the buffer,
     * making room by vacating the least recently added message
     * if necessary.  Also maintain the min and max values
     * for all keys with numeric values.
     * 
     * @param {string} msg 
     * @param {any} data 
     * @param {string} field_specifier
     */
    function onMessage(msg, data, field_specifier=undefined) {

        /**
         * Process a single telemetry record.
         * @param {any} telemetry 
         */
        function processTelemetry(telemetry) {
            if (telemetry) {
                if(_telemetry.length === maxHistory) {
                    _telemetry.shift();
                }
                _telemetry.push(telemetry);

                //
                // maintain min/max ranges for numeric
                // fields so we can use them when plotting
                //
                for(const [key, value] of Object.entries(telemetry)) {
                    _maintainMaximum(key, value);
                    _maintainMinimum(key, value);
                }

                // publish update message with reference to this telemetry buffer.
                if(messageBus) {
                    messageBus.publish(`${msg}-update`, self);
                }
            }
        }

        if(message() === msg) {
            if (specifier()) {
                if(data.hasOwnProperty(specifier())) {
                    processTelemetry(data[specifier()])
                } 
            }
        }
    }

    /**
     * Get the maximum number of telemetry messages
     * that the buffer can hold.
     * 
     * @returns {number}
     */
    function capacity() {
        return maxHistory;
    }

    /**
     * Get the current number of telemetry messages
     * in the buffer.
     * 
     * @returns {number}
     */
    function count() {
        return _telemetry.length;
    }

    /**
     * Empty the telemetry buffer and reset minimum and maximum tracking.
     * 
     * @returns {TelemetryListenerType} // RET: self for fluent chained api calls.
     */
    function reset() {
        _telemetry = [];
        _minimum = {};
        _maximum = {};

        // publish update message with reference to this telemetry buffer.
        if(messageBus) {
            messageBus.publish(`${message()}-update`, self);
        }
        return self;
    }

    /**
     * Get the oldest telemetry record in the buffer.
     * 
     * @returns {TelemetryType}
     * @throws {RangeError} if buffer is empty.
     */
    function first() {
        return get(0);
    }

    /**
     * Get the most recent telemetry record in the buffer.
     * 
     * @returns {TelemetryType}
     * @throws {RangeError} if buffer is empty.
     */
    function last() {
        return get(count() - 1);
    }

    /**
     * Get the maximum value for the key seen in
     * the telemetry data.
     * 
     * @param {string} key 
     * @param {number} defaultValue // IN : default is key has no value
     * @returns {number}            // RET: the maximum value for the key 
     *                                      or if the key has not been seen since
     *                                      startup or the last reset() then 
     *                                      return the provided default value.
     */
    function maximum(key, defaultValue = 0) {
        return _maximum.hasOwnProperty(key) ? _maximum[key] : defaultValue;
    }

    /**
     * Get the minimum value for the key seen in
     * the telemetry data.
     * 
     * @param {string} key 
     * @param {number} defaultValue // IN : default is key has no value
     * @returns {number}            // RET: the minimum value for the key 
     *                                      or if the key has not been seen since
     *                                      startup or the last reset() then 
     *                                      return the provided default value.
     */
    function minimum(key, defaultValue = 0) {
        return _minimum.hasOwnProperty(key) ? _minimum[key] : defaultValue;
    }

    /**
     * Get the zero-indexed i-th telemetry record.
     * 
     * @param {number} i        // where i >= 0, i < count()
     * @returns {TelemetryType}
     * @throws {RangeError}     // if i is out of range.
     */
    function get(i) {
        if((i >= 0) && (i < count())) {
            return _telemetry[i];
        }
        throw RangeError("Telemetry.get() out of range");
    }

    /**
     * Remove all records whose "at" timestamp field
     * is less then the given timestamp.
     * 
     * @param {number} timeStamp 
     * @returns {TelemetryListenerType} self for fluent chained api calls.
     */
    function trimBefore(timeStamp) {
        while((_telemetry.length > 0) && (_telemetry[0]['at'] < timeStamp)) {
            // remove first element
            _telemetry.shift()
        }
        return self;
    }


    /**
     * Construct an iterator for the telemetry buffer.
     * 
     * @returns {TelemetryIteratorType}
     */
    function iterator() {
        let i = 0;

        /**
         * Determine if there are anymore values to iterate.
         * @returns true if thare are more values to iterate,
         *          false if iteration is complete.
         */
        function hasNext() {
            return i < self.count();
        }

        /**
         * Get the next telemetry item.
         * 
         * @returns {TelemetryType}
         * @throws {RangeError} if iteration is complete.
         */
        function next() {
            if(hasNext()) {
                const value = self.get(i);
                i += 1;
                return value;
            }
            throw RangeError("iterator is out of range.")
        }

        /** @type {TelemetryIteratorType} */
        return Object.freeze({
            "hasNext": hasNext,
            "next": next,
        });
    }

    /** @type {TelemetryListenerType} */
    const self = Object.freeze({
        "message": message,
        "specifier": specifier,
        "capacity": capacity,
        "count": count,
        "reset": reset,
        "get": get,
        "first": first,
        "last": last,
        "minimum": minimum,
        "maximum": maximum,
        "trimBefore": trimBefore,
        "iterator": iterator,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    });

    return self;
}
