

/**
 * Construct a Telemetry buffer that listens
 * for incoming telemetry and saves it in a
 * buffer.
 * 
 * example telemetry:
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
 * 
 */
function TelemetryListener(messageBus, spec, maxHistory) {
    let _telemetry = [];
    let _listening = 0;
    let _minimum = {};
    let _maximum = {};

    function specifier() {
        return spec;
    }

    function isListening() {
        return _listening > 0;
    }

    function startListening() {
        if(1 == (_listening += 1)) {
            messageBus.subscribe("telemetry", self);
        }

        return self;
    }

    function stopListening() {
        if(0 == (_listening -= 1)) {
            messageBus.unsubscribe("telemetry", self);
        }

        return self;
    }

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


    function onMessage(message, data) {
        if("telemetry" === message) {
            if(data.hasOwnProperty(specifier())) {
                if(_telemetry.length === maxHistory) {
                    _telemetry.shift();
                }
                _telemetry.push(data[specifier()]);

                //
                // maintain min/max ranges for numeric
                // fields so we can use them when plotting
                //
                for(const [key, value] of Object.entries(data[specifier()])) {
                    _maintainMaximum(key, value);
                    _maintainMinimum(key, value);
                }

                // publish update message with reference to this telemetry buffer.
                messageBus.publish("telemetry-update", self);
            }
        }
    }

    function capacity() {
        return maxHistory;
    }

    function count() {
        return _telemetry.length;
    }

    function reset() {
        _telemetry = [];
        _minimum = {};
        _maximum = {};
        return self;
    }

    function first() {
        return get(0);
    }

    function last() {
        return get(count() - 1);
    }

    function maximum(key, defaultValue = 0) {
        return _maximum.hasOwnProperty(key) ? _maximum[key] : defaultValue;
    }

    function minimum(key, defaultValue = 0) {
        return _minimum.hasOwnProperty(key) ? _minimum[key] : defaultValue;
    }

    function get(i) {
        if((i >= 0) && (i < _telemetry.length)) {
            return _telemetry[i];
        }
        throw RangeError("Telemetry.get() out of range");
    }

    /**
     * Construct and iterator for the telemetry buffer.
     */
    function iterator() {
        let i = 0;

        function hasNext() {
            return i < self.count();
        }

        function next() {
            if(hasNext()) {
                const value = self.get(i);
                i += 1;
                return value;
            }
            throw RangeError("iterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        };
    }

    const self = {
        "specifier": specifier,
        "capacity": capacity,
        "count": count,
        "reset": reset,
        "get": get,
        "first": first,
        "last": last,
        "minimum": minimum,
        "maximum": maximum,
        "iterator": iterator,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    }
    return self;
}
