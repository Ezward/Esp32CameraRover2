//////////// bundle.js //////////////

// global constants
const LEFT_WHEEL = "left";
const RIGHT_WHEEL = "right";
const LEFT_WHEEL_INDEX = 0;
const RIGHT_WHEEL_INDEX = 1;
const LEFT_WHEEL_ID = (0x01 << LEFT_WHEEL_INDEX);
const RIGHT_WHEEL_ID = (0x01 << RIGHT_WHEEL_INDEX);

/**
 * Singleton to lookup name of wheels.
 */
const Wheels = (() => {
    const WHEEL_INDEX = {
        "left": 0,
        "right": 1
    };
    const WHEEL_NAME = [
        "left",
        "right"
    ];
    const WHEEL_ID = [
        0x01,
        0x02
    ]

    function count() {
        return WHEEL_NAME.length;
    }

    function name(wheelIndex) {
        return WHEEL_NAME[wheelIndex];
    }

    function index(wheelName) {
        return WHEEL_INDEX[wheelName];
    }

    function id(wheelName) {
        return WHEEL_ID[wheelName];
    }

    const self = Object.freeze({
        "name": name,
        "index": index,
        "id": id,
        "count": count,
    });

    return self
})();
const WHEEL_ID = {
    "left": 1,
    "right": 2,
};
const WHEEL_NAME = [
    "left",
    "right"
];

const WHEEL_COUNT = WHEEL_NAME.length

/**
 * Given a wheel name, return the wheel number.
 * 
 * NOTE: Wheel numbers begin at 1.
 * 
 * @param {string} wheelName     // IN : wheel's name
 * @returns {number | undefined} // RET: if the wheelName is valid then return the wheel number
 *                                       otherwise return undefined.
 */
function wheelNumber(wheelName) {
    return WHEEL_ID[wheelName];
}

/**
 * Given a wheel number, return the wheel name.
 * 
 * NOTE: Wheel numbers begin at 1.
 * 
 * @param {number} wheelNumber   // IN : wheel number
 * @returns {string | undefined} // RET: if wheel number is valid, then return wheel name
 *                                       otherwise return undefined
 */
function wheelName(wheelNumber) {
    return WHEEL_NAME[wheelNumber - 1];
}


/**
 * singleton that holds readonly configuration values.
 */
const config = function() {

    /**
     * @returns {number} - number of millisecnods to show
     *                     on the time axis of the pwm/speed
     *                     telemetry plot.
     */
    function telemetryPlotMs() { return 10000; }

    /**
     * @returns {number} - number of samples in telemetry buffer.
     */
    function telemetryBufferSize() { return 200; }
    function poseTelemetrySize() { return 200; }

    function chartBackgroundColor() { return "#181818" /*"#363636"*/; };
    function chartAxisColor() { return "#EFEFEF"; }
    function leftSpeedColor() { return "lightblue"; }
    function rightSpeedColor() { return "blue"; }
    function leftTargetColor() { return "lightgreen"; }
    function rightTargetColor() { return "green"; }
    function leftPwmColor() { return "lightyellow"; }
    function rightPwmColor() { return "yellow"; }
    function poseLineColor() { return "pink"; }
    function posePointColor() { return "red"; }
    function averageSpeedMs() { return 2000; }

    const self = {
        "telemetryPlotMs": telemetryPlotMs,
        "telemetryBufferSize": telemetryBufferSize,
        "poseTelemetrySize": poseTelemetrySize,
        "chartBackgroundColor": chartBackgroundColor,
        "chartAxisColor": chartAxisColor,
        "leftSpeedColor": leftSpeedColor,
        "rightSpeedColor": rightSpeedColor,
        "leftTargetColor": leftTargetColor,
        "rightTargetColor": rightTargetColor,
        "leftPwmColor": leftPwmColor,
        "rightPwmColor": rightPwmColor,
        "poseLineColor": poseLineColor,
        "posePointColor": posePointColor,
        "averageSpeedMs": averageSpeedMs,
    }

    return self;
}();//
///////////////// dom utilities //////////////
//

/**
 * Hide the element
 * @param {Element} el 
 */
const hide = el => {
    el.classList.add('hidden')
}

/**
 * show the element
 * @param {Element} el 
 */
const show = el => {
    el.classList.remove('hidden')
}

/**
 * disable the element
 * @param {Element} el 
 */
const disable = el => {
    el.classList.add('disabled')
    el.setAttribute('disabled', '')
}

/**
 * enable the element
 * @param {Element} el 
 */
const enable = el => {
    el.classList.remove('disabled')
    el.removeAttribute('disabled')
}

/**
 * determine if an html element has a value attribute.
 * 
 * @param {Element} el  // IN : html element
 * @returns {boolean}       // RET: true if element has a value attribute
 *                                  false if element does not have a value attribute
 */
const has_value = el => {
    return (el instanceof HTMLInputElement) || 
           (el instanceof HTMLSelectElement) ||
           (el instanceof HTMLMeterElement) ||
           (el instanceof HTMLProgressElement) ||
           (el instanceof HTMLButtonElement) ||
           (el instanceof HTMLOptionElement) ||
           (el instanceof HTMLLIElement);
}

/**
 * Set the value attribute of an element if the
 * element has one.
 * 
 * NOTE: only certain kinds of elements have a value
 *       attribute.  You can determine if the element
 *       has a value attribute by calling has_value().
 * 
 * @param {Element} el 
 * @param {any} value 
 */
const set_value = (el, value) => {
    if ((el instanceof HTMLInputElement) || 
        (el instanceof HTMLSelectElement) ||
        (el instanceof HTMLMeterElement) ||
        (el instanceof HTMLProgressElement) ||
        (el instanceof HTMLButtonElement) ||
        (el instanceof HTMLOptionElement) ||
        (el instanceof HTMLLIElement)) {
        el.value = value;
    }
}


/**
 * Get the value attribute of an element if the
 * element has one.
 * 
 * NOTE: only certain kinds of elements have a value
 *       attribute.  You can determine if the element
 *       has a value attribute by calling has_value().
 * 
 * @param {Element} el    // IN : the element
 * @returns {any | undefined} // RET: value if element has a value attribute
 *                                    or undefined if element does not have value attribute 
 */
const get_value = (el) => {
    if ((el instanceof HTMLInputElement) || 
        (el instanceof HTMLSelectElement) ||
        (el instanceof HTMLMeterElement) ||
        (el instanceof HTMLProgressElement) ||
        (el instanceof HTMLButtonElement) ||
        (el instanceof HTMLOptionElement) ||
        (el instanceof HTMLLIElement)) {
        return el.value
    }
    return undefined
}

/**
 * Determine if an html element has a checked attribute.
 * 
 * @param {Element} el 
 * @returns {boolean}
 */
const has_checked = (el) => {
    return (el instanceof HTMLInputElement && el.type == "checkbox")
}


/**
 * Get the checked attribute of an html element.
 * 
 * NOTE: only the input element of type 'checkbox' has
 *       a checked attribute.
 * 
 * @param {Element} el        // IN : the html element
 * @returns {boolean | undefined} // RET: if element is a checkbox, then the checked state,
 *                                //      if element is NOT a checkbox, then undefined.
 */
const get_checked = (el) => {
    if (el instanceof HTMLInputElement && el.type == "checkbox") {
        return el.checked
    }
    return undefined
}

/**
 * Set the checked attribute of an html element.
 * 
 * NOTE: only the input element of type 'checkbox' has
 *       a checked attribute.
 * 
 * @param {Element} el 
 * @param {boolean} checked 
 */
const set_checked = (el, checked) => {
    if (el instanceof HTMLInputElement && el.type == "checkbox") {
        el.checked = checked
    }
}

/////////////////// utilities /////////////////

/**
 * Validate that assertion is true or throw an Error().
 * 
 * @param {boolean} assertion 
 * @throws {Error} // EXC: if assertion is false
 */
function assert(assertion) {
    if (true != assertion) {
        throw new Error("assertion failed");
    }
}

/**
 * Absolute value of a number.
 * 
 * @param {number} x 
 * @returns {number}
 * @throws {TypeError} // EXC: If x is not a number type.
 */
function abs(x) {
    if("number" !== typeof x) throw new TypeError();
    return (x >= 0) ? x : -x;
}

/**
 * Coerce a number to an integer.
 * 
 * @param {number} x 
 * @returns {number}   // RET: integer number
 * @throws {TypeError} // EXC: if x is not a number type.
 */
function int(x) {
    if("number" !== typeof x) throw new TypeError();
    return x | 0;
}

/**
 * Get maximum of two numeric values.
 * 
 * @param {number} x 
 * @param {number} y
 * @returns {number}   // RET: maximum of x and y 
 * @throws {TypeError} // EXC: if argument is not a number type.
 */
function max(x, y) {
    if("number" !== typeof x) throw new TypeError();
    if("number" !== typeof y) throw new TypeError();
    return (x >= y) ? x : y;
}

/**
 * Get minium of two numeric values.
 * 
 * @param {number} x 
 * @param {number} y
 * @returns {number}   // RET: minimum of x and y 
 * @throws {TypeError} // EXC: if argument is not a number.
 */
function min(x, y) {
    if("number" !== typeof x) throw new TypeError();
    if("number" !== typeof y) throw new TypeError();
    return (x < y) ? x : y;
}

/**
 * Validate a value is a number and optionally falls within an range.
 * 
 * @param {number} value         // IN : numeric value to validate
 * @param {number|undefined} min // IN : if a number, then this is minimum valid value inclusive
 *                               //      if undefined then no minimum check is made
 * @param {number|undefined} max // IN : if a number, then this is maximum valid value inclusive
 *                               //      if undefined then no maximum check is made
 * @param {boolean} exclusive    // IN : true if range is exclusive, false if inclusive.
 *                               //      default is false (inclusive)
 * @returns {boolean}            // RET: true if valid and within range, false otherwise
 */
function isValidNumber(value, min = undefined, max = undefined, exclusive = false) {
    // must be a number
    let valid = (typeof value === "number");
    
    // must be at or above min if there is a min
    valid = valid && 
        ((typeof min === "undefined") || 
         ((typeof min === "number") && exclusive ? (value > min) : (value >= min)));
    
    // must be at or below max if there is a max
    valid = valid && 
        ((typeof max === "undefined") || 
         ((typeof max == "number") && exclusive ? (value < max) : (value <= max)));
    
    return valid;
}

/**
 * constrain a value to a range.
 * - if the value is < min, then it becomes the min.
 * - if the value > max, then it becomes the max.
 * - otherwise it is unchanged.
 * 
 * @param {number} value // IN : value to constrain
 * @param {number} min   // IN : minimum value inclusive
 * @param {number} max   // IN : maximum value inclusive
 * @returns {number}     // RET: min <= number <= max
 * @throws {TypeError}   // EXC: if argument is not a number.
 */
function constrain(value, min, max) {
    if (typeof value !== "number") throw new TypeError();
    if (typeof min !== "number") throw new TypeError();
    if (typeof max !== "number") throw new TypeError();
    if (min > max) throw new Error();

    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/**
 * map a value in one range to another range
 * 
 * @param {number} value 
 * @param {number} fromMin 
 * @param {number} fromMax 
 * @param {number} toMin 
 * @param {number} toMax 
 * @returns {number}
 * @throws {TypeError} // EXC: if an argument is not a number
 */
function map(value, fromMin, fromMax, toMin, toMax) {
    if (typeof value !== "number") throw new TypeError();
    if (typeof fromMin !== "number") throw new TypeError();
    if (typeof fromMax !== "number") throw new TypeError();
    if (typeof toMin !== "number") throw new TypeError();
    if (typeof toMax !== "number") throw new TypeError();

    const fromRange = fromMax - fromMin;
    const toRange = toMax - toMin;
    return (value - fromMin) * toRange / fromRange + toMin
}

/**
 * create a new list by keeping all elements in the original list
 * that return true when passed to the given filterFunction
 * and discarding all other elements.
 *
 * NOTE: This is safe to use on result of document.querySelectorAll(),
 *       which does not have a filter() method.
 * 
 * @param {any[]} list 
 * @param {(any) => boolean} filterFunction 
 * @returns {any[]}
 */
function filterList(list, filterFunction) {
    var elements = [];

    // Loop through each element, apply filter and push to the array
    if (typeof filterFunction === "function") {
        for (let i = 0; i < list.length; i += 1) {
            const element = list[i];
            if (filterFunction(element)) {
                elements.push(element);
            }
        }
    }
    return elements;
}

/*
** remove the first matching element from the list
*/
/**
 * Remove the first matching element from the list.
 * 
 * @param {any[]} list  // IN : list of elements
 *                      // OUT: list with element removed
 * @param {any} element // IN : element to remove
 * @returns {void}
 */
function removeFirstFromList(list, element) {
    if (list) {
        const index = list.indexOf(element);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }
}

/**
 * Remove all matching elements from the list.
 * 
 * @param {any[]} list  // IN : list of elements
 *                      // OUT: list with all matching elements removed
 * @param {any} element // IN : element to remove
 * @returns {void}
 */
function removeAllFromList(list, element) {
    if (list) {
        let index = list.indexOf(element);
        while (index >= 0) {
            list.splice(index, 1);
            index = list.indexOf(element, index);
        }
    }
}
////////////// fetch utilities ///////////////

/**
 * fetch wrapped with a response timeout
 * 
 * @param {string} url 
 * @param {number} timeoutMs 
 * @returns {Promise}
 */
function fetchWithTimeout(url, timeoutMs = 2000) {
    let didTimeOut = false;

    return new Promise(function (resolve, reject) {
        const timeout = setTimeout(function () {
            didTimeOut = true;
            reject(new Error('Request timed out'));
        }, timeoutMs);

        fetch(url)
            .then(function (response) {
                // Clear the timeout as cleanup
                clearTimeout(timeout);
                if (!didTimeOut) {
                    console.log('fetch good! ', response);
                    resolve(response);
                }
            })
            .catch(function (err) {
                console.log('fetch failed! ', err);

                // Rejection already happened with setTimeout
                if (didTimeOut) return;
                // Reject with error
                reject(err);
            });
    })
}

/**
 * @summary Function that message subscribers must implement.
 * 
 * @typedef {(message: string, data: any, specifier: string | undefined) => void} onMessageFunction
 */
/**
 * Interface that message bus subscribers must implement,
 * 
 * @typedef {Object} SubscriberType
 * @property {onMessageFunction} onMessage
 */

/**  
 * A message bus that maintains subscribers and publishes 
 * messages to them.
 * 
 * @typedef {Object} MessageBusType
 * @property {(message: string, 
 *             data: any, 
 *             specifier?: string, 
 *             subscriber?: SubscriberType) => void} publish
 * @property {(message: string, subscriber: SubscriberType) => void} subscribe
 * @property {(message: string, subscriber: SubscriberType) => void} unsubscribe
 * @property {(subscriber: SubscriberType) => void} unsubscribeAll
*/

/**
 * Construct a MessageBusType instance
 * 
 * @returns {MessageBusType}
 */
const MessageBus = () => {
    const subscriptions = {};

    /**
     * Subscribe to a message.
     * 
     * @param {string} message 
     * @param {SubscriberType} subscriber 
     * @returns {void}
     */
    const subscribe = (message, subscriber) => {
        if (!subscriber) throw new TypeError("Missing subscriber");
        if ("function" !== typeof subscriber["onMessage"]) throw new TypeError("Invalid subscriber");
        if ("string" != typeof message) throw new TypeError("Invalid message");

        let subscribers = subscriptions[message];
        if (!subscribers) {
            subscriptions[message] = (subscribers = []);
        }
        subscribers.push(subscriber);
    }

    /**
     * Unsubscribe from a message.
     * 
     * @param {string} message 
     * @param {SubscriberType} subscriber 
     * @returns {void}
     */
    const unsubscribe = (message, subscriber) => {
        const subscribers = subscriptions[message];
        if(subscribers) {
            removeFirstFromList(subscribers, subscriber);
        }
    }

    /**
     * Unsubscribe from all messages.
     * 
     * @param {SubscriberType} subscriber 
     */
    const unsubscribeAll = (subscriber) => {
        for(const message in subscriptions) {
            if(subscriptions.hasOwnProperty(message)) {
                const subscribers = subscriptions[message];
                if(subscribers) {
                    removeAllFromList(subscribers, subscriber);
                }
            }
        }
    }

    /**
     * Publish a message to a single subscriber OR to all subscribers.
     * If subscriber is undefined then publish to all subscribers
     * of the given message.
     * 
     * @param {string} message 
     * @param {any} data 
     * @param {string} specifier 
     * @param {SubscriberType} subscriber
     * @returns {void}
     * @throws {TypeError} // EXC: if message is not a string
     *                             or if subscriber does not have onMessage method.
     */
    const publish = (message, data = null, specifier = undefined, subscriber = undefined) => {
        if ("string" != typeof message) throw new TypeError("Invalid message");

        if (subscriber) {
            // direct message
            if ("function" !== typeof subscriber["onMessage"]) throw new TypeError("Invalid subscriber");

            subscriber.onMessage(message, data, specifier);
        } else {
            // broadcase message
            let subscribers = subscriptions[message];
            if (subscribers) {
                subscribers.forEach(subscriber => subscriber.onMessage(message, data, specifier));
            }
        }
    }

    const exports = Object.freeze({
        "publish": publish,
        "subscribe": subscribe,
        "unsubscribe": unsubscribe,
        "unsubscribeAll": unsubscribeAll,
    });

    return exports;
}

/**
 * Key/Value store where values can be staged
 * and then committed or rolled back.
 * Staged values can be used as a 'diff' 
 * between a new state and the prior state.
 * ```
 *   let state = RollbackState();
 *   state.setValue("foo", "bar");
 *   let value = state.getValue("foo");
 * ```
 * 
 * @typedef {Object} RollbackStateType
 * @property {(key: string) => boolean} isStaged
 * @property {(key: string) => boolean} isCommitted
 * @property {(key: string) => boolean} isUncommitted
 * @property {(key: string) => boolean} hasValue
 * @property {(key: string, value: any) => void} setValue
 * @property {(key: string) => any} getValue
 * @property {(key: string, value: any) => void} setStagedValue
 * @property {(key: string) => any} getStagedValue
 * @property {() => string[]} getStagedKeys
 * @property {(key: string) => boolean} isStaged
 * @property {(key: string) => boolean} isCommitted
 * @property {(key: string) => boolean} hasValue
 * @property {(key: string) => boolean} isUncommitted
 * @property {(key: string) => any} getCommittedValue
 * @property {() => string[]} getCommittedKeys
 * @property {(key: string) => any} commitValue
 * @property {() => void} commit
 * @property {(key: string) => void} rollbackValue
 * @property {() => void} rollback
 * @property {() => void} reset
 * @property {(key: string, value: any) => void} setValue
 * @property {(key: string) => any} getValue
 * @property {() => string[]} getKeys
 * @property {() => object} getCopy
 */

/**
 * Construct a RollbackState instance.
 * 
 * @param {object} defaultState
 * @returns {RollbackStateType}
 */
const RollbackState = (defaultState = {}) => {
    const baseState = { ...defaultState }; // default committed state
    let committed = { ...defaultState }; // committed state
    let staged = {}; // newly staged state

    /**
     * Validated key is a non-empty string
     * 
     * @param {string} key 
     */
    const _assertKey = function (key) {
        if ((typeof key !== "string") || ("" === key)) {
            throw TypeError()
        }
    }

    /**
     * Stage the value if it has changed.
     * 
     * @param {string} key 
     * @param {any} value 
     */
    const setStagedValue = function (key, value) {
        _assertKey(key);
        staged[key] = value;
    }

    /**
     * Get a staged value.
     * 
     * @param {string} key 
     * @returns {any}
     */
    const getStagedValue = function (key) {
        _assertKey(key);
        return staged[key];
    }

    /**
     * Get the keys of all staged values.
     * 
     * @returns {string[]}
     */
    const getStagedKeys = function () {
        return Object.keys(staged);
    }

    /**
     * Determine if a key has a staged value.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    const isStaged = function (key) {
        _assertKey(key);
        return staged.hasOwnProperty(key);
    }

    /**
     * Determine if a key has a committed value.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    const isCommitted = function (key) {
        _assertKey(key);
        return committed.hasOwnProperty(key);
    }

    /**
     * Determine if the key is in the state
     * as either a staged or committed.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    const hasValue = function (key) {
        _assertKey(key);
        return isStaged(key) || isCommitted(key);
    }

    /**
     * Determine if a key has a staged value, but
     * has no prior committed value.  
     * In otherwords, determine if this
     * is a new state value.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    const isUncommitted = function (key) {
        _assertKey(key);
        return staged.hasOwnProperty(key) &&
            !committed.hasOwnProperty(key);
    }


    /**
     * Get a committed value.
     * 
     * @param {string} key 
     * @returns {any}
     */
    const getCommittedValue = function (key) {
        _assertKey(key);
        return committed[key];
    }

    /**
     * Get the keys for all commited values.
     * 
     * @returns {string[]}
     */
    const getCommittedKeys = function () {
        return Object.keys(committed);
    }

    //
    // commit any staged value and 
    // return the committed value
    //
    /**
     * Commit a valueand return it.
     * 
     * @param {string} key 
     * @returns {any}
     */
    const commitValue = function (key) {
        _assertKey(key);
        if (isStaged(key)) {
            committed[key] = staged[key];
            delete staged[key];
        }
        return committed[key];
    }

    /**
     * Commit all staged values by moving 
     * into commited values and clearing the stage.
     * 
     * @returns {void}
     */
    const commit = function () {
        for (const key in staged) {
            committed[key] = staged[key];
        }
        staged = {};
    }

    /**
     * Rollback a a staged value.
     * 
     * @param {string} key 
     * @returns {void}
     */
    const rollbackValue = function (key) {
        _assertKey(key);
        delete staged[key];
    }

    /**
     * Rollback all staged values.
     * 
     * @returns {void}
     */
    const rollback = function () {
        staged = {};
    }

    /**
     * Reset the committed state to the initial values
     * and clear the staged state.
     * 
     * @returns {void}
     */
    const reset = function () {
        staged = {};
        committed = { ...baseState
        };
    }

    /**
     * Set and stage a value.  
     * Note: the value is only staged if the set value
     *       differs from the current value as returned
     *       by getValue()
     * 
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    const setValue = function (key, value) {
        _assertKey(key);
        if (value !== getValue(key)) {
            staged[key] = value;
        }
    }


    /**
     * Get a value from the state;
     * - if staged, returned staged value
     * - if committed, return committed value
     * - otherwise return undefined
     * 
     * @param {string} key non-empty string
     * @returns {any}
     */
    const getValue = function (key) {
        _assertKey(key);
        if (isStaged(key)) {
            return staged[key];
        }
        return committed[key];
    }

    /**
     * Return the keys of values in the state.
     * This list of keys can be used to iterate
     * all values in the state.
     * For example:
     * ```
     *   const keys = getKeys();
     *   for(let i = 0; i < keys.length; i += 1) {
     *     const value = getValue(key);
     *   }
     * ```
     * @returns {string[]}
     */
    const getKeys = function () {
        return getCopy().keys();
    }

    /**
     * Return a shallow copy of the state
     * that includes staged and committed values.
     * 
     * @returns {object}
     */
    const getCopy = function () {
        return { ...staged, ...committed };
    }

    /** @type {RollbackStateType} */
    const self = Object.freeze({
        "isStaged": isStaged,
        "isCommitted": isCommitted,
        "isUncommitted": isUncommitted,
        "hasValue": hasValue,
        "setValue": setValue,
        "getValue": getValue,
        "setStagedValue": setStagedValue,
        "getStagedValue": getStagedValue,
        "getCommittedValue": getCommittedValue,
        "getStagedKeys": getStagedKeys,
        "getCommittedKeys": getCommittedKeys,
        "getKeys": getKeys,
        "commitValue": commitValue,
        "commit": commit,
        "rollbackValue": rollbackValue,
        "rollback": rollback,
        "reset": reset,
        "getCopy": getCopy,
    });

    return self;
}


///////////////// Web Socket Streaming /////////////////

/**
 * @summary A streaming image socket instance.
 * 
 * @typedef {object} StreamingSocketType
 * @property {() => boolean} isReady
 * @property {() => void} start
 * @property {() => void} stop
 */

/**
 * @summary Construct a streaming image socket.
 * 
 * @description
 * The websocket listens for binary data and
 * treats is as a jpeg image.  The image is
 * then assigned to the src attribute of
 * the provided image element.
 * 
 * @param {string} hostname 
 * @param {number} port 
 * @param {HTMLImageElement} imageElement 
 * @returns {StreamingSocketType}
 */
function StreamingSocket(hostname, port, imageElement) {
    //
    // stream images via websocket port 81
    //
    /** @type {WebSocket | null} */
    var socket = null;

    /**
     * @summary Determine if socket is opened and ready.
     * 
     * @returns {boolean}
     */
    function isReady() {
        return socket && (WebSocket.OPEN === socket.readyState);
    }

    /**
     * @summary Open the websocket.
     */
    function start() {
        socket = new WebSocket(`ws://${hostname}:${port}/stream`, ['arduino']);
        socket.binaryType = 'arraybuffer';

        try {
            socket.onopen = function () {
                console.log("StreamingSocket opened");
            }

            socket.onmessage = function (msg) {
                console.log("StreamingSocket received message");
                if("string" !== typeof msg) {
                    // convert message data to readable blob and assign to img src
                    const bytes = new Uint8Array(msg.data); // msg.data is jpeg image
                    const blob = new Blob([bytes.buffer]); // convert to readable blob
                    imageElement.src = URL.createObjectURL(blob); // assign to img source to draw it
                } else {
                    console.warn("StreamingSocket received unexpected text message: " + msg);
                }
            };

            socket.onclose = function () {
                console.log("StreamingSocket closed");
                socket = null;
            }
        } catch (exception) {
            console.log("StreamingSocket exception: " + exception);
        }
    }

    /**
     * @summary Close the websocket.
     */
    function stop() {
        if (socket) {
            if ((socket.readyState !== WebSocket.CLOSED) && (socket.readyState !== WebSocket.CLOSING)) {
                socket.close();
            }
            socket = null;
        }
    }

    /** @type {StreamingSocketType} */
    const exports = Object.freeze({
        "start": start,
        "stop": stop,
        "isReady": isReady,
    });

    return exports;
}
/// <reference path="../utilities/utilities.js" />
/// <reference path="view_validation_tools.js" />
/// <reference path="../utilities/rollback_state.js" />

/**
 * Singleton with utility functions that
 * are used to update a rollback state
 * used as a view state.
 */
const ViewStateTools = (function() {

    /**
     * Validate numeric value and update state.
     * 
     * @param {RollbackStateType} rollbackState // OUT: get's updated rollbackState.get(key) value
     * @param {string} key                  // IN : property name to update in rollbackState
     * @param {string} keyValid             // IN : if defined, name of boolean property in rollbackState
     *                                      //      that tracks if the state value is valid.
     * @param {number | string} value       // IN : updated value to validate and set if valid
     * @param {number} minValue             // IN : if defined, this is minimum allowed value inclusive
     * @param {number} maxValue             // IN : if defined, this is maximum allowed value inclusive
     * @returns {boolean}                   // RET: true if new valid is valid, false if invalid
     */
    function updateNumericState(
        rollbackState, key, keyValid, 
        value,                  // IN : new value for state
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
    {
        const numericValue = ViewValidationTools.validateNumericInput(value, minValue, maxValue);
        if(typeof numericValue == "number") {
            // valid number within range
            rollbackState.setValue(key, numericValue);
            if(!!keyValid) rollbackState.setValue(keyValid, true);
            return true;
        } else {
            if(!!keyValid) rollbackState.setValue(keyValid, false);    // show as invalid
            return false;
        }
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {HTMLSelectElement} selectElement 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceSelectMenu(rollbackState, propertyName, selectElement, force = false) {
        //
        // enforce the select menu's value
        //
        if (force || rollbackState.isStaged(propertyName)) {
            if (selectElement) {
                selectElement.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }

        return false;
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {Element} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceText(rollbackState, propertyName, element, force = false) {
        //
        // enforce the text element's value
        //
        if (force || rollbackState.isStaged(propertyName)) {
            if (element) {
                element.textContent = rollbackState.commitValue(propertyName);
                return true;
            }
        }

        return false;
    }

    /**
     * Enforce state change to input element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {HTMLInputElement} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceInput(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {HTMLInputElement} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceCheck(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.checked = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    /**
     * Enforce the "invalid" class name on an element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName name of boolean state property 
     *                              with value of true is valid, false is invalid
     * @param {Element} element element that gets 'invalid' class name 
     * @param {boolean} force optional; defaults to false
     *                        - true to force committing state,
     *                        - false to commit state only if it changed 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceValid(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                const valid = rollbackState.commitValue(propertyName);
                if(valid) {
                    element.classList.remove("invalid");
                } else {
                    element.classList.add("invalid");
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Enforce state change in range control's value;
     * make the view match the state.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {HTMLInputElement} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceRange(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    const self = Object.freeze({
        "enforceSelectMenu": enforceSelectMenu,
        "enforceText": enforceText,
        "enforceInput": enforceInput,
        "enforceCheck": enforceCheck,
        "enforceValid": enforceValid,
        "enforceRange": enforceRange,
        "updateNumericState": updateNumericState,
    });

    return self;
}());
/**
 * Validate values pulled from DOM.
 */
const ViewValidationTools = (function() {
    /**
     * Validate text as a number in the given range.
     * 
     * @param {string | number} value 
     * @param {number} minValue 
     * @param {number} maxValue 
     * @return {number | undefined}
     */
    function validateNumericInput(
        value,                  // IN : text to validate as a number
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
                                // RET: if valid, the number
                                //      if invalid, undefined
    {
        //
        // check input type
        //
        let numericValue = undefined
        if (typeof value == "string") {
            numericValue = parseFloat(value);
        } else if (typeof value == "number") {
            numericValue = value
        } else {
            console.log("Value that is not a string or number cannot be validated and is ignored.");
            return undefined
        }

        if (isNaN(numericValue)) return undefined;
        if ((typeof minValue == "number") && (numericValue < minValue)) return undefined;
        if ((typeof maxValue == "number") && (numericValue > maxValue)) return undefined;
        return numericValue;
    }

    const self = {
        "validateNumericInput": validateNumericInput,
    }

    return self;
}());/// <reference path="../utilities/rollback_state.js" />

/**
 * Singleton with function that help 
 * in maintain view elements.
 */
const ViewWidgetTools = (function() {
    /**
     * Increment a range input element's state.
     * 
     * @param {RollbackStateType} state     // state bound to range control
     * @param {string} parameter        // name of state parameter
     * @param {string} parameterLive    // name of live update state parameter
     * @param {number} increment        // range's increment value
     * @param {number} maxRange         // range's maximum allowed value
     * @param {number} decimals         // number of decimals to show in value
     */
    function onRangeIncrement(state, parameter, parameterLive, increment, maxRange, decimals) {
        // update state to cause a redraw on game loop
        let value = state.getValue(parameter);
        if((typeof value == "number") && (value <= (maxRange - increment)))
        {
            value = constrain(parseFloat((value + increment).toFixed(decimals)), 0, 1);
            state.setValue(parameter, value);
            state.setValue(parameterLive, value);
        }
    }

    /**
     * Decrement a range input element's state.
     * 
     * @param {RollbackStateType} state     // state bound to range control
     * @param {string} parameter        // name of state parameter
     * @param {string} parameterLive    // name of live update state parameter
     * @param {number} increment        // range's increment value
     * @param {number} minRange         // range's minimum allowed value
     * @param {number} decimals         // number of decimals to show in value
     */
    function onRangeDecrement(state, parameter, parameterLive, increment, minRange, decimals) {
        // update state to cause a redraw on game loop
        let value = state.getValue(parameter);
        if((typeof value == "number") && (value >= (minRange + increment)))
        {
            value = constrain(parseFloat((value - increment).toFixed(decimals)), 0, 1);
            state.setValue(parameter, value);
            state.setValue(parameterLive, value);
        }
    }

    /**
     * Clear all the select menu options.
     * 
     * @param {HTMLSelectElement} select 
     */
    function clearSelectOptions(select) {
        if (select) {
            while (select.options.length > 0) {
                select.remove(0);
            }
        }
    }

    const exports = Object.freeze({
        "onRangeIncrement": onRangeIncrement,
        "onRangeDecrement": onRangeDecrement,
        "clearSelectOptions": clearSelectOptions,
    });

    return exports;
}());/// <reference path="../../../utilities/dom_utilities.js" />
/// <reference path="../../../view/view_widget_tools.js" />
/// <reference path="../../../utilities/rollback_state.js" />

/**
 * @summary View controller for slider control.
 * 
 * @description
 * A view controller for a multi-element range 
 * (slider) control with increment/decrement controls,
 * value display and live update.
 * 
 * @typedef {object} RangeWidgetControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => RangeWidgetControllerType} attachView
 * @property {() => RangeWidgetControllerType} detachView
 * @property {() => boolean} isListening
 * @property {() => RangeWidgetControllerType} startListening
 * @property {() => RangeWidgetControllerType} stopListening
 * @property {() => boolean} isViewShowing
 * @property {() => RangeWidgetControllerType} showView
 * @property {() => RangeWidgetControllerType} hideView
 * @property {(force?: boolean) => RangeWidgetControllerType} updateView
 * @property {(force?: boolean) => RangeWidgetControllerType} updateViewState
 * @property {(force?: boolean) => boolean} enforceView
 */

/**
 * @description
 * Construct controller for a multi-element range 
 * (slider) control with increment/decrement controls,
 * value display and live update.
 * 
 * @param {RollbackStateType} rollbackState // IN : state with value and live update value
 *                                          // OUT: state updated on calls to updateView()
 *                                                  and/or enforceView()
 * @param {string} key                  // IN : state key for range value
 * @param {string} liveKey              // IN : state key for live update value
 * @param {number} maxRange             // IN : minimum allowed range value inclusive
 * @param {number} minRange             // IN : maximum allowed range value inclusive
 * @param {number} increment            // IN : amound to inc/dec value by using slider or buttons
 * @param {number} decimals             // IN : integer, number of decimals in range value text 
 * @param {string} cssContainer         // IN : css selector for range widget container element
 * @param {string} cssInput             // IN : css selector for range input element
 * @param {string} cssText              // IN : css selector for range value text element
 * @param {string} cssInc               // IN : css selector for increment button element
 * @param {string} cssDec               // IN : css selector for decrement button element
 * @returns {RangeWidgetControllerType}     // RET: RangeWidgetController instance
 */
function RangeWidgetController(
    rollbackState, key, liveKey, 
    maxRange, minRange, increment, decimals, 
    cssContainer, 
    cssInput = "input[type=range]", cssText = ".range-value", cssInc = ".range-max", cssDec = ".range-min") 
{
    let _container = undefined;
    let _rangeInput = undefined;
    let _rangeText = undefined;
    let _rangeInc = undefined;
    let _rangeDec = undefined;
    
    /**
     * @summary Determine if the controller is bound to the DOM.
     * 
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    function isViewAttached()
    {
        return !!_container;
    }

    /**
     * @summary Bind the controller to the associated DOM elements.
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {RangeWidgetControllerType} this RangeWidgetController instance
     */
    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);
        if(!_container) throw Error(`${cssContainer} not found`);

        _rangeInput = _container.querySelector(cssInput);
        _rangeText = _container.querySelector(cssText);

        _rangeInc = _container.querySelector(cssInc);
        _rangeDec = _container.querySelector(cssDec);
        
        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * 
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {RangeWidgetControllerType} this RangeWidgetController instance
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if (isViewAttached()) {
            _container = undefined;

            _rangeInput = undefined;
            _rangeText = undefined;
    
            _rangeInc = undefined;
            _rangeDec = undefined;
        }
        return self;
    }

    let _listening = 0;

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for DOM events.
     * @description
     * This adds event listeners to attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {RangeWidgetControllerType} this RangeWidgetController instance
     */
    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            if(isViewAttached()) {
                _rangeInput.addEventListener("change", _onChanged);
                _rangeInput.addEventListener("input", _onLiveUpdate);

                _rangeInc.addEventListener("click", _onIncrement);
                _rangeDec.addEventListener("click", _onDecrement);
            }
        }

        return self;
    }

    /**
     * @summary Stop listening for DOM events.
     * @description
     * This removes event listeners from attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {RangeWidgetControllerType} this RangeWidgetController instance
     */
    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {

            if(isViewAttached()) {
                _rangeInput.removeEventListener("change", _onChanged);
                _rangeInput.removeEventListener("input", _onLiveUpdate);

                _rangeInc.removeEventListener("click", _onIncrement);
                _rangeDec.removeEventListener("click", _onDecrement);
            }
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    /**
     * @summary Determine if the view is showing.
     * 
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    function isViewShowing() {
        return _showing > 0;
    }

    /**
     * @summary Show/Enable the view.
     * 
     * @description
     * Show the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {RangeWidgetControllerType} this RangeWidgetController instance
     */
    function showView() {
        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    /**
     * @summary Hide/Disable the view.
     * 
     * @description
     * Hide the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {RangeWidgetControllerType} this RangeWidgetController instance
     */
    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * @summary Update view state and render if changed.
     * 
     * @description
     * This updates the view state and if anything has changed,
     * then the view is redrawn to match the view state.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns {RangeWidgetControllerType} this RangeWidgetController instance
     */
    function updateView(force = false) {
        // make sure live state matches state of record
        updateViewState(force).enforceView(force);
        return self;
    }

    /**
     * @summary Update view state.
     * 
     * @description
     * This update the view state and notes any changes.
     * 
     * @param {boolean} force // IN : true to force update, 
     *                        //      false to update only on change.
     * @returns {RangeWidgetControllerType} this RangeWidgetController instance
     */
    function updateViewState(force = false) {
        // make sure live state matches state of record
        if(force || rollbackState.isStaged(key)) {
            rollbackState.setValue(liveKey, rollbackState.getValue(key));
        }
        return self;
    }

    /**
     * @summry Make the view match the view state.
     * 
     * @description
     * The looks for changes in state and then updates
     * the DOM to match.  If there are no changes then
     * nothing is redrawn unless force == true.
     * 
     * @param {boolean} force   // IN : true to force re-render
     * @returns {boolean}       // RET: true if range state value (rollbackState.get(key)) is updated,
     *                                  false otherwise.
     */
    function enforceView(force = false) {
        let updated = ViewStateTools.enforceInput(rollbackState, key, _rangeInput, force);

        // NOTE: we don't include the live update in the return value
        ViewStateTools.enforceText(rollbackState, liveKey, _rangeText, force || updated);

        return updated; // return true if state value was updated
    }


    /**
     * @summary DOM event handler on a drop change event.
     * 
     * @description This is called when the range value is changed;
     *              which happens when the widget is 'dropped'.
     *              It sets the state and the live-value state.
     * 
     * @param {Event & {target: {value: string}}} event 
     */
    function _onChanged(event) {
        // update state to cause a redraw on game loop
        const value = parseFloat(event.target.value)
        rollbackState.setValue(key, value);
        rollbackState.setValue(liveKey, value);
    }

    /**
     * @summary Event handler called on a drag change.
     * 
     * @description This is called when the live-value is changed;
     *              this happens while the widget is dragged.
     *              This will update the live-value state if a live change is made.
     * 
     * @param {Event & {target: {value: string}}} event 
     */
    function _onLiveUpdate(event) {
        // update state to cause a redraw on game loop
        rollbackState.setValue(liveKey, parseFloat(event.target.value));
    }

    /**
     * @summary Event handler called with the increment button is clicked.
     * 
     * @param {Event} event 
     */
    function _onIncrement(event) {
        // update state to cause a redraw on game loop
        ViewWidgetTools.onRangeIncrement(rollbackState, key, liveKey, increment, maxRange, decimals);
    }

    /**
     * @summary Event handler called with the decrement button is clicked.
     * 
     * @param {Event} event 
     */
    function _onDecrement(event) {
        // update state to cause a redraw on game loop
        ViewWidgetTools.onRangeDecrement(rollbackState, key, liveKey, increment, minRange, decimals);
    }

    /** @type {RangeWidgetControllerType} */
    const self = Object.freeze({
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
        "updateView": updateView,
        "updateViewState": updateViewState,
        "enforceView": enforceView,
    });

    return self;
}
/// <reference path="../../../config/config.js" />
/// <reference path="../../../utilities/utilities.js" />
/// <reference path="../../../utilities/dom_utilities.js" />

/**
 * @typedef {object} TabViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => TabViewControllerType} attachView
 * @property {() => TabViewControllerType} detachView
 * @property {() => boolean} isViewShowing
 * @property {() => TabViewControllerType} showView
 * @property {() => TabViewControllerType} hideView
 * @property {() => boolean} isListening
 * @property {() => TabViewControllerType} startListening
 * @property {() => TabViewControllerType} stopListening
 * @property {(tab: HTMLElement) => TabViewControllerType} activateTab
 */

/**
 * Controller for tab view:
 * 
 * When a tab is clicked, it is activated and the sibling tabs are
 * deactivated.  The content associated with the selected tablink
 * element (specified as a css selector in the element's 
 * data-tabcontent attribute) is shown.  Likewise, the tabcontent 
 * of sibling tablink elements is hidden.  
 * 
 * If a messageBus is supplied to the constructor, then 'tabActivated' 
 * and 'tabDeactivated' messages are published on the bus.
 * The data for the message is the tabcontent selector specified
 * in the tablink element's data-tabcontent attribute.  
 * Your code should expect the a message will be sent for each
 * tablink element (specifically, the a tabDeactivated message will be 
 * sent even if the tab is already deactivated).  
 * You code should_not_ assume any ordering for how the tabActivated 
 * and tabDeactivate messages are sent.
 * 
 * const viewController = TabViewController(cssTabContainer, cssTabLink);
 * viewController.attachView();     // select DOM under view control
 * viewController.startListening(); // attach event handlers to DOM
 * viewController.showView();       // show the DOM
 * // View is showing
 * viewController.hideView();       // hide the DOM
 * viewController.stopListening();  // remove event handlers
 * viewController.detachView();     // clear references to DOM
 * 
 * @param {string} cssTabContainer 
 * @param {string} cssTabLinks 
 * @param {MessageBusType | null} messageBus 
 * @returns {TabViewControllerType}
 */
function TabViewController(cssTabContainer, cssTabLinks, messageBus = null) {
    /** @type {HTMLElement | null} */
    let _tabContainer = null;

    /** @type {NodeListOf<HTMLElement> | null} */
    let _tabLinks = null;

    /** @type {string[]} */
    let _tabContentSelector = [];

    /** @type {HTMLElement[]} */
    let _tabContent = [];

    /**
     * @summary Determine if dom elements have been attached.
     * @returns {boolean}
     */
    function isViewAttached() {
        return ((!!_tabContainer) && (!!_tabLinks));
    }

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {TabViewControllerType} // this controller for fluent chain calling
     */
    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        _tabContainer = document.querySelector(cssTabContainer);
        _tabLinks = _tabContainer.querySelectorAll(cssTabLinks);

        // collect that tab content associated with each tab
        _tabContent = [];
        _tabContentSelector = [];
        for (let i = 0; i < _tabLinks.length; i += 1) {
            // read value of data-tabcontent attribute
            _tabContentSelector.push(_tabLinks[i].dataset.tabcontent);
            _tabContent.push(document.querySelector(_tabContentSelector[i]))
        }
        if(_tabLinks.length > 0) {
            activateTab(_tabLinks[0]); // select the first tab, hide the others
        }

        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * 
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {TabViewControllerType} // this controller for fluent chain calling
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        _tabContainer = null;
        _tabLinks = null;
        _tabContent = [];
        _tabContentSelector = [];

        return self;
    }

    let _showing = 0;

    /**
     * @summary Determine if the view is showing.
     * 
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    function isViewShowing() {
        return _showing > 0;
    }
    
    /**
     * @summary Show/Enable the view.
     * 
     * @description
     * Show the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function showView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        _showing += 1;
        if (1 === _showing) {
            show(_tabContainer);
        }

        return self;
    }

    /**
     * @summary Hide/Disable the view.
     * 
     * @description
     * Hide the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function hideView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        _showing -= 1;
        if (0 === _showing) {
            hide(_tabContainer);
        }

        return self;
    }

    let _listening = 0;

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for DOM events.
     * @description
     * This adds event listeners to attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            if (_tabLinks) {
                _tabLinks.forEach(el => el.addEventListener("click", _onTabClick));
            }
        }

        return self;
    }

    /**
     * @summary Stop listening for DOM events.
     * @description
     * This removes event listeners from attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {
            if (_tabLinks) {
                _tabLinks.forEach(el => el.removeEventListener("click", _onTabClick));
            }
        }

        return self;
    }

    /**
     * @summary Activate a tab and deactivate the others
     * 
     * @description
     * This will activate/show the give tab and
     * hide/disable the others.  
     * The activated tab starts listening and the 
     * disabled tabs stop listening.
     * If a message bus has been provided, then a message
     * is published for each tab's new state, so that
     * other parts of the app can coordinate their 
     * behavior if necessary.
     * - publish `TAB_ACTIVATED(tabname)` message when a tas is activate
     * - publish `TAB_DEACTIVATED(tabname)` message when a tab is deactivated.
     * 
     * @param {HTMLElement} tab 
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function activateTab(tab) {
        for (let i = 0; i < _tabLinks.length; i += 1) {
            const tabLink = _tabLinks[i];
            if (tab === tabLink) {
                // activate this tab's content
                tabLink.classList.add("active");
                if (_tabContent[i]) {
                    show(_tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_ACTIVATED(${_tabContentSelector[i]})`);
                }
            } else {
                // deactivate this tab's content
                tabLink.classList.remove("active");
                if (_tabContent[i]) {
                    hide(_tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_DEACTIVATED(${_tabContentSelector[i]})`);
                }
            }
        }

        return self;
    }

    /**
     * @summary Event handler when a tab is clicked.
     * 
     * @description
     * When a table is clicked then activateTab() is called
     * for that tab, which enables it and disables the others.
     * 
     * @param {*} event 
     */
    function _onTabClick(event) {
        // make this tab active and all siblings inactive
        activateTab(event.target);
    }

    /** @type {TabViewControllerType} */
    const self = Object.freeze({
        "attachView": attachView,
        "detachView": detachView,
        "isViewAttached": isViewAttached,
        "showView": showView,
        "hideView": hideView,
        "isViewShowing": isViewShowing,
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "activateTab": activateTab,
    });

    return self;
}/// <reference path="../../../utilities/utilities.js" />

// #include "./utilities.js"


/**
 * @summary Canvas fill style
 * @typedef {string | CanvasGradient | CanvasPattern} CanvasFillStyleType
 */

/**
 * @typedef {object} Point2dType
 * @property {number} x
 * @property {number} y
 */

/**
 * @summary Construct an x,y point
 * 
 * @param {number} x 
 * @param {number} y 
 * @returns {Point2dType}
 */
function Point(x, y) {
    if (typeof x !== "number" || typeof y !== "number") {
        console.log(`WARNING: Point constructed with non-number (${x},${y})`)
    }
    return {x: x, y: y};
}

/**
 * @summary Iterator for (x,y) points
 * 
 * @typedef {object} Point2dIteratorType
 * @property {() => boolean} hasNext
 * @property {() => Point2dType} next
 */

/**
 * Construct telemetry iterator that returns (x, y) pairs.
 * 
 * @param {TelemetryListenerType} telemetry 
 * @returns {Point2dIteratorType}
 */
function Point2dIterator(telemetry) {
    let i = 0;
    function hasNext() {
        return i < telemetry.count();
    }
    function next() {
        if(hasNext()) {
            const value = telemetry.get(i);
            i += 1;
            return Point(value.x, value.y);
        }
        throw RangeError("PointIterator is out of range.")
    }

    return {
        "hasNext": hasNext,
        "next": next,
    }
}



/**
 * @summary Struct to hold border thicknesses.
 * 
 * @typedef {object} BorderType
 * @property {number} left
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 */

/**
 * @summary Singleton with chart utilities.
 * @description Chart utilities to calculate the border thicknesses 
 *              given axis' text and tick length.
 */
const ChartUtils = (function() {
    /**
     * Calculate area required by labels and ticks
     * and use this to set char area.
     * 
     * @param {CanvasRenderingContext2D} context 
     * @param {number} tickLength 
     * @param {string} leftTicksText  // IN : string representing widest possible tick label,
     *                                        defaults to "888.8"
     * @param {string} rightTicksText // IN : string representing widest possible tick label,
     *                                        defaults to "888.8"
     * @returns {BorderType}          // RET: border sizes as {left, top, right, bottom}
     */
    function calcBorders(context, tickLength, leftTicksText = "888.8", rightTicksText = "888.8") {
        // leave space for labels
        const leftMetrics = context.measureText(leftTicksText);
        const rightMetrics = context.measureText(rightTicksText);
        const leftBorderWidth = int(leftMetrics.actualBoundingBoxLeft + leftMetrics.actualBoundingBoxRight + tickLength + 2);
        const rightBorderWidth = int(rightMetrics.actualBoundingBoxLeft + rightMetrics.actualBoundingBoxRight + tickLength + 2);

        const borderHeight = int(
            max(leftMetrics.actualBoundingBoxAscent + leftMetrics.actualBoundingBoxDescent, 
                rightMetrics.actualBoundingBoxAscent + rightMetrics.actualBoundingBoxDescent) + tickLength + 2);

        return {
            "left": leftBorderWidth,
            "top": borderHeight,
            "right": rightBorderWidth,
            "bottom": borderHeight,
        };
    }

    const self = Object.freeze({
        "calcBorders": calcBorders,
    });

    return self;
})();

/**
 * @summary An axis instance.
 * @description An axis is a edge bordering the active chart area
 *              on top, bottom, left or right edges.
 *              An axis has a minimum and maximum value, so it
 *              represents a range of values.
 *              An axis can have ticks and text drawn on it.
 * 
 * @typedef {object} AxisType
 * @property {() => boolean} isContextAttached
 * @property {(context: CanvasRenderingContext2D) => AxisType} attachContext
 * @property {() => AxisType} detachContext
 * @property {(lineColor: any) => AxisType} setLineColor
 * @property {(left: number, top: number, right: number, bottom: number) => Axis} setLineColor
 * @property {(leftTicksText?: string, rightTicksText?: string) => AxisType} autoSetChartArea
 * @property {(left: number, top: number, right: number, bottom: number) => AxisType} setChartArea
 * @property {(min: number) => AxisType} setMinimum
 * @property {() => number} minimum
 * @property {(max: number) => AxisType} setMaximum
 * @property {() => number} maximum
 * @property {() => number} mid
 * @property {(numberOfTicks: number) => AxisType} setTicks
 * @property {() => number} ticks
 * @property {() => number} tickLength
 * @property {(tickLength: number) => AxisType} setTickLength
 * @property {() => AxisType} drawLeftAxis
 * @property {() => AxisType} drawRightAxis
 * @property {() => AxisType} drawLeftTicks
 * @property {() => AxisType} drawRightTicks
 * @property {() => AxisType} drawBottomAxis
 * @property {() => AxisType} drawTopAxis
 * @property {() => AxisType} drawBottomTicks
 * @property {() => AxisType} drawTopTicks
 * @property {(text: string, y: number) => AxisType} drawLeftText
 * @property {(text: string, y: number) => AxisType} drawRightText
 * @property {(text: string, x: number) => AxisType} drawTopText
 * @property {(text: string, x: number) => AxisType} drawBottomText
 */

/**
 * @summary Construct a axis instance.
 * @description An axis is a edge bordering the active chart area
 *              on top, bottom, left or right edges.
 *              An axis has a minimum and maximum value, so it
 *              represents a range of values.
 *              An axis can have ticks and text drawn on it.
 * 
 * @returns {AxisType}
 */
function Axis() {
    let _min = 0;
    let _max = 1;

    /** @type {CanvasRenderingContext2D} */
    let _context = undefined;
    let _contextWidth = 0;
    let _contextHeight = 0;
    let _left = 0;
    let _right = 1;
    let _top = 0;
    let _bottom = 1;
    let _ticks = 2;
    let _tickLength = 3;
    let _lineColor = "white";


    /**
     * @summary Determine if a canvas context is attached.
     * 
     * @returns {boolean}
     */
    function isContextAttached() {
        return !!_context;
    }

    /**
     * @summary Bind to a canvas context
     * 
     * @param {CanvasRenderingContext2D} context // IN : canvas Context2D 
     * @return {AxisType} // RET: this Axis for fluent chain calls
     */
    function attachContext(context) {
        _context = context;
        _contextWidth = _context.canvas.width;
        _contextHeight = _context.canvas.height;
        return self;
    }

    /**
     * @summary Detach the canvas context.
     * 
     * @return {AxisType} // RET: this Axis for fluent chain calls
     */
    function detachContext() {
        _context = null;
        return self;
    }

    /**
     * @summary Set the line drawing color.
     * 
     * @param {string} lineColor 
     * @return {AxisType} // RET: this Axis for fluent chain calls
     */
    function setLineColor(lineColor) {
        _lineColor = lineColor;
        return self;
    }

    /**
     * @summary Calculate area required by labels and ticks
     *          and use this to set chart area.
     * 
     * @param {string} leftTicksText  // IN : string representing widest possible tick label,
     *                                        defaults to "888.8"
     * @param {string} rightTicksText // IN : string representing widest possible tick label,
     *                                        defaults to "888.8"
     * @return {AxisType}             // RET: this Axis for fluent chain calls
     */
    function autoSetChartArea(leftTicksText = "888.8", rightTicksText = "888.8") {
        const borders = ChartUtils.calcBorders(_context, _tickLength, leftTicksText, rightTicksText);
        return setChartArea(borders.left, borders.top, _contextWidth - borders.right, _contextHeight - borders.bottom);
    }

    /**
     * @summary Set draw area for chart.
     * 
     * @param {number} left      // IN : left bound of plot area in canvas coordinates
     * @param {number} top       // IN : top bound of plot area in canvas coordinates
     * @param {number} right     // IN : right bound of plot area in canvas coordinates
     * @param {number} bottom    // IN : bottom bound of plot area in canvas coordinates
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setChartArea(left, top, right, bottom) {
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

        return self;
    }

    /**
     * @summary Set axis' minimum value.
     * 
     * @param {number} min 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setMinimum(min) {
        _min = min;
        return self;
    }

    /**
     * @summary Get axis' minimum value.
     * 
     * @returns {number}
     */
    function minimum() {
        return _min;
    }

    /**
     * @summary Set axis' maximum value.
     * 
     * @param {number} max 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setMaximum(max) {
        _max = max;
        return self;
    }

    /**
     * @summary Get axis' maximum value.
     * 
     * @returns {number}
     */
    function maximum() {
        return _max;
    }

    /**
     * @summary Get axis' mid value.
     * 
     * @returns {number}
     */
    function mid() {
        return _min + (_max - _min) / 2;
    }

    /**
     * @summary Set the number of ticks on the axis.
     * 
     * @param {number} numberOfTicks 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setTicks(numberOfTicks) {
        _ticks = numberOfTicks;
        return self;
    }

    /**
     * @summary Get number of ticks on the axis.
     * 
     * @returns {number}
     */
    function ticks() {
        return _ticks;
    }

    /**
     * @summary Get the tick length in pixels.
     * 
     * @returns {number}
     */
    function tickLength() {
        return _tickLength;
    }

    /**
     * @summary Set the tick length in pixels.
     * 
     * @param {number} tickLength 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setTickLength(tickLength) {
        _tickLength = tickLength;
        return self;
    }


    /**
     * @summary Draw the axis as a left axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawLeftAxis() {
        return _drawAxisY(_left);
    }

    /**
     * @summary Draw the axis as a right axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawRightAxis() {
        return _drawAxisY(_right);
    }

    /**
     * @summary Draw the axis ticks as a left axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawLeftTicks() {
        return _drawTicksY(_left, _tickLength);
    }

    /**
     * @summary Draw the axis ticks as a right axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawRightTicks() {
        return _drawTicksY(_right, -_tickLength);
    }

    /**
     * @summary Draw the axis as a bottom axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawBottomAxis() {
        return _drawAxisX(_bottom);
    }

    /**
     * @summary Draw the axis as a top axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawTopAxis() {
        return _drawAxisX(_top);
    }

    /**
     * @summary Draw the axis ticks as a bottom axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawBottomTicks() {
        return _drawTicksX(_bottom, _tickLength);
    }

    /**
     * @summary Draw the axis ticks as a top axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawTopTicks() {
        return _drawTicksX(_top, -_tickLength);
    }

    /**
     * @summary Draw text on the left axis.
     * 
     * @param {string} text 
     * @param {number} y 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawLeftText(text, y) {
        return _drawText(text, _left - (_tickLength + 1), _toCanvasY(y), 'right');
    }

    /**
     * @summary Draw text on the right axis.
     * 
     * @param {string} text 
     * @param {number} y 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawRightText(text, y) {
        return _drawText(text, _right + (_tickLength + 1), _toCanvasY(y), 'left');
    }

    /**
     * @summary Draw text on the top axis.
     * 
     * @param {string} text 
     * @param {number} x 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawTopText(text, x) {
        return _drawText(text, _toCanvasX(x), _top - (_tickLength + 1), 'center');
    }

    /**
     * @summary Draw text on the bottom axis.
     * 
     * @param {string} text 
     * @param {number} x 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawBottomText(text, x) {
        return _drawText(text, _toCanvasX(x), _bottom + (_tickLength + 1), 'center', 'top');
    }

    /**
     * @summary Draw text at the given position.
     * 
     * @private
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {CanvasTextAlign} align 
     * @param {CanvasTextBaseline} baseline 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function _drawText(text, x, y, align = 'center', baseline = 'middle') {
        if(!isContextAttached()) {
            console.error("Drawing Axis text requires an attached context");
            return self;
        }

        if(typeof text !== 'string') {
            return self;
        }

        _context.fillStyle = _lineColor;
        _context.textAlign = align;
        _context.textBaseline = baseline;
        _context.fillText(text, x, y);

        return self;
    }

    /**
     * @summary Draw horizontal axis line.
     * 
     * @private
     * @param {number} y // IN : vertical position of horizontal axis.
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function _drawAxisX(y) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(_left, y);
        _context.lineTo(_right, y);
        _context.stroke();

        return self;
    }

    /**
     * @summary Draw ticks on a horizontal axis.
     * 
     * @private
     * @param {number} y           // IN : vertical position of horizontal axis.
     * @param {number} tickLength  // IN : length of tick in pixels.
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function _drawTicksX(y, tickLength) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;

        const width = (_right - _left);
        for(let i = 0; i < _ticks; i += 1) {
            const x = _left + ((_ticks > 1) ? int(i * width / (_ticks - 1)) : 0);
            _context.beginPath();
            _context.moveTo(x, y);
            _context.lineTo(x, y + tickLength);
            _context.stroke();
        }
        return self;
    }

    /**
     * @summary Draw a vertical axis line.
     * 
     * @private
     * @param {number} x // IN : horizontal position of the vertial axis.
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function _drawAxisY(x) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }
        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(x, _bottom);
        _context.lineTo(x, _top);
        _context.stroke();

        return self;
    }

    /**
     * @summary Draw ticks on a vertical axis.
     * 
     * @private
     * @param {number} x          // IN : horizontal position of vertical axis.
     * @param {number} tickLength // IN : length of ticks in pixels.
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function _drawTicksY(x, tickLength) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;

        const height = (_bottom - _top);
        for(let i = 0; i < _ticks; i += 1) {
            const y = _bottom - ((_ticks > 1) ? int(i * height / (_ticks - 1)) : 0)
            _context.beginPath();
            _context.moveTo(x, y);
            _context.lineTo(x - tickLength, y);
            _context.stroke();
        }
        return self;
    }

    /**
     * @summary Map a horizontal value from axis coordinates to canvas coordinates
     * 
     * @private
     * @param {number} x // IN : horizontal axis coordinate
     * @returns {number} // RET: horizontal canvas coordinates
     */
    function _toCanvasX(x) {
        return int(map(x, minimum(), maximum(), _left, _right));
    }

    /**
     * @summary Map a vertical value from axis coordinates to canvas coordinates
     * 
     * @private
     * @param {number} y // IN : vertical axis coordinate
     * @returns {number} // RET: vertical canvas coordinate
     */
    function _toCanvasY(y) {
        return int(map(y, minimum(), maximum(), _bottom, _top));
    }

    /** @type {AxisType} */
    const self = {
        "isContextAttached": isContextAttached,
        "attachContext": attachContext,
        "detachContext": detachContext,
        "setLineColor": setLineColor,
        "setChartArea": setChartArea,
        "autoSetChartArea": autoSetChartArea,
        "setMinimum": setMinimum,
        "minimum": minimum,
        "setMaximum": setMaximum,
        "maximum": maximum,
        "mid": mid,
        "setTicks": setTicks,
        "ticks": ticks,
        "setTickLength": setTickLength,
        "tickLength": tickLength,
        "drawLeftAxis": drawLeftAxis,
        "drawRightAxis": drawRightAxis,
        "drawLeftTicks": drawLeftTicks,
        "drawRightTicks": drawRightTicks,
        "drawTopAxis": drawTopAxis,
        "drawBottomAxis": drawBottomAxis,
        "drawTopTicks": drawTopTicks,
        "drawBottomTicks": drawBottomTicks,
        "drawLeftText": drawLeftText,
        "drawRightText": drawRightText,
        "drawTopText": drawTopText,
        "drawBottomText": drawBottomText,
    }

    return self;
}

/**
 * @typedef {object} LineChartType
 * @property {() => boolean} isContextAttached
 * @property {(context: CanvasRenderingContext2D) => LineChartType} attachContext
 * @property {() => LineChartType} detachContext
 * @property {(lineColor: string) => LineChartType} setLineColor
 * @property {(pointColor: string) => LineChartType} setPointColor
 * @property {(textColor: string) => LineChartType} setTextColor
 * @property {(leftTicksText?: string, rightTicksText?: string) => LineChartType} autoSetChartArea
 * @property {(left: number, top: number, right: number, bottom: number) => LineChartType} setChartArea
 * @property {(pt: Point2dType, xAxis: AxisType, yAxis: AxisType) => boolean} pointInChart
 * @property {(dataIterator: Point2dIteratorType, xAxis: AxisType, yAxis: AxisType) => LineChartType} plot
 * @property {(dataIterator: Point2dIteratorType, xAxis: AxisType, yAxis: AxisType) => LineChartType} plotLine
 * @property {(dataIterator: Point2dIteratorType, xAxis: AxisType, yAxis: AxisType) => LineChartType} plotPoints
 * @property {(p0: Point2dType, xAxis: AxisType, yAxis: AxisType) => LineChartType} drawPoint
 * @property {(y: number, xAxis: AxisType, yAxis: AxisType, dashOn?: number, dashOff?: number) => LineChartType} drawHorizontal
 * @property {(x: number, xAxis: AxisType, yAxis: AxisType, dashOn?: number, dashOff?: number) => LineChartType} drawVertical
 * @property {(text: string, x: number, y: number, xAxis: AxisType, yAxis: AxisType, align?: CanvasTextAlign, baseline?: CanvasTextBaseline) => LineChartType} drawText
 * @property {(pt: Point2dType, xAxis: AxisType, yAxis: AxisType) => Point2dType} toCanvas
 * @property {(pt: Point2dType, xAxis: AxisType, yAxis: AxisType) => Point2dType} toAxes
 */
/**
 * Construct a line chart.
 * @returns {LineChartType}
 */
function LineChart() {
    /** @type {CanvasRenderingContext2D} */
    let _context = undefined;
    let _contextWidth = 0;
    let _contextHeight = 0;
    let _left = 0;
    let _right = 1;
    let _top = 0;
    let _bottom = 1;
    let _lineColor = "blue";
    let _pointColor = "red";
    let _textColor = "green";

    /**
     * Determine if a canvas context is attached.
     * 
     * @returns {boolean}
     */
    function isContextAttached() {
        return !!_context;
    }

    /**
     * Bind to a canvas context
     * 
     * @param {CanvasRenderingContext2D} context // IN : canvas Context2D 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function attachContext(context) {
        _context = context;
        _contextWidth = _context.canvas.width;
        _contextHeight = _context.canvas.height;
        return self;
    }

    /**
     * Detach the canvas context.
     * 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function detachContext() {
        _context = null;
        return self;
    }

    /**
     * Set line drawing color.
     * 
     * @param {string} lineColor 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function setLineColor(lineColor) {
        _lineColor = lineColor;
        return self;
    }

    /**
     * Set drawing color for points in chart.
     * 
     * @param {string} pointColor 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function setPointColor(pointColor) {
        _pointColor = pointColor;
        return self;
    }

    /**
     * Set the text drawing color.
     * 
     * @param {string} textColor 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function setTextColor(textColor) {
        _textColor = textColor;
        return self;
    }

    /**
     * Calculate area required by labels and ticks
     * and use this to set the chart area.
     * 
     * @param {string} leftTicksText  - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @param {string} rightTicksText - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function autoSetChartArea(leftTicksText = "888.8", rightTicksText = "888.8") {
        const borders = ChartUtils.calcBorders(_context, 0 /*_tickLength*/, leftTicksText, rightTicksText);
        return setChartArea(borders.left, borders.top, _contextWidth - borders.right, _contextHeight - borders.bottom);
    }

    /**
     * Set draw area for chart.
     * 
     * @param {number} left 
     * @param {number} top 
     * @param {number} right 
     * @param {number} bottom 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function setChartArea(left, top, right, bottom) {
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

        return self;
    }

    /**
     * Determine if the given (x,y) is in the chart area.
     * 
     * @param {Point2dType} pt 
     * @returns {boolean}
     */
    function _pointInChartArea(pt) {
        return ((pt.x >= _left) && (pt.x < _right) 
                && (pt.y >= _top) && (pt.y < _bottom));
    }


    /**
     * Determine if a point {x, y} is in chart bounds.
     * 
     * @param {Point2dType} pt 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @returns {boolean}
     */
    function pointInChart(pt, xAxis, yAxis) {
        return ((pt.x >= xAxis.minimum()) && (pt.x <= xAxis.maximum()) 
                && (pt.y >= yAxis.minimum()) && (pt.y <= yAxis.maximum()));
    }

    /**
     * Line chart with points.
     * 
     * @param {Point2dIteratorType} dataIterator 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function plot(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        if(dataIterator.hasNext()) {
            let p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            while(dataIterator.hasNext()) {
                const p1 = toCanvas(dataIterator.next(), xAxis, yAxis);

                if(_pointInChartArea(p0)) 
                {
                    //
                    // line segment from p0 to p1
                    //
                    if(_pointInChartArea(p1)) {
                        _line(p0, p1)
                    }

                    //
                    // point at p0
                    //
                    _point(p0);
                }
                p0 = p1
            }

            // last point
            if(_pointInChartArea(p0)) {
                _point(p0);
            }
        }

        return self;
    }

    /**
     * Line plot without points.
     * 
     * @param {Point2dIteratorType} dataIterator 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function plotLine(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        if(dataIterator.hasNext()) {
            let p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            while(dataIterator.hasNext()) {
                const p1 = toCanvas(dataIterator.next(), xAxis, yAxis);

                //
                // line segment from p0 to p1
                //
                if(_pointInChartArea(p0)) 
                {
                    if(_pointInChartArea(p1)) {
                        _line(p0, p1)
                    }
                }
                p0 = p1
            }
        }

        return self;
    }

    /**
     * Plot points only.
     * 
     * @param {Point2dIteratorType} dataIterator 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function plotPoints(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        while(dataIterator.hasNext()) {
            const p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            if(_pointInChartArea(p0)) {
                _point(p0);
            }
        }

        return self;
    }

    /**
     * Draw a single point.
     * 
     * @param {Point2dType} p0 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function drawPoint(p0, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        const chartPt = toCanvas(p0, xAxis, yAxis);
        if(_pointInChartArea(chartPt)) {
            _point(chartPt);
        }

        return self;
    }

    /**
     * Draw horizontal line from left to right of chart.
     * 
     * @param {number} y 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @param {number} dashOn   // IN : positive integer for dashed line.  
     *                                  This is teh length of the dash, and if
     *                                  no dashOff is supplied, the length of 
     *                                  the gap. defaults to 0, no dash.
     * @param {number} dashOff  // IN : if a positive integer, then this is the
     *                                  length of the gap. defaults to zero,
     *                                  so dashOn is used for gap.
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function drawHorizontal(y, xAxis, yAxis, dashOn = 0, dashOff = 0) {
        if(!isContextAttached()) {
            console.error("Drawing requires an attached context");
            return self;
        }

        if(y >= yAxis.minimum() && y <= yAxis.maximum()) {
            if((typeof dashOn === "number") && (dashOn > 0)) {
                const onPixels = dashOn;
                let offPixels = dashOff;
                if((typeof dashOff === "number") && (dashOff > 0)) {
                    offPixels = dashOff;
                }
                _context.setLineDash([onPixels, offPixels]);
            }
            const p0 = toCanvas(Point(xAxis.minimum(), y), xAxis, yAxis);
            const p1 = toCanvas(Point(xAxis.maximum(), y), xAxis, yAxis);
            _line(p0, p1);
            _context.setLineDash([]);   // reset to solid line

        }

        return self;
    }

    /**
     * Draw vertical line from top to bottom of chart.
     * 
     * @param {number} x 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @param {number} dashOn   // IN : positive integer for dashed line.  
     *                                  This is teh length of the dash, and if
     *                                  no dashOff is supplied, the length of 
     *                                  the gap. defaults to 0, no dash.
     * @param {number} dashOff  // IN : if a positive integer, then this is the
     *                                  length of the gap. defaults to zero,
     *                                  so dashOn is used for gap.
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function drawVertical(x, xAxis, yAxis, dashOn = 0, dashOff = 0) {
        if(!isContextAttached()) {
            console.error("Drawing requires an attached context");
            return self;
        }

        if(x >= xAxis.minimum() && x <= xAxis.maximum()) {
            if((typeof dashOn === "number") && (dashOn > 0)) {
                const onPixels = dashOn;
                let offPixels = dashOff;
                if((typeof dashOff === "number") && (dashOff > 0)) {
                    offPixels = dashOff;
                }
                _context.setLineDash([onPixels, offPixels]);
            }
            const p0 = toCanvas(Point(x, yAxis.minimum()), xAxis, yAxis);
            const p1 = toCanvas(Point(x, yAxis.maximum()), xAxis, yAxis);
            _line(p0, p1);
            _context.setLineDash([]);   // reset to solid line
        }

        return self;
    }

    /**
     * Draw text at an arbitrary location in the chart area.
     * Clipping is done against the provided point (x,y);
     * if that point falls within the chart area then 
     * the text will be drawn, otherwise it will not be drawn.
     * 
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @param {CanvasTextAlign} align 
     * @param {CanvasTextBaseline} baseline 
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function drawText(text, x, y, xAxis, yAxis, align = 'center', baseline = 'middle') {
        if(!isContextAttached()) {
            console.error("Drawing Chart text requires an attached context");
            return self;
        }

        if(x >= xAxis.minimum() && x <= xAxis.maximum()) {
            if((y >= yAxis.minimum()) && (y <= yAxis.maximum())) {
                const p0 = toCanvas(Point(x, y), xAxis, yAxis);
                _drawText(text, p0.x, p0.y, align, baseline);
            }
        }

        return self;
    }

    /**
     * Map a Point from axis coordinates to canvas coordinates
     * 
     * @param {Point2dType} pt   // IN : {x, y} in Axis coordinates
     * @param {AxisType} xAxis       // IN : horizontal Axis
     * @param {AxisType} yAxis       // IN : vertical Axis
     * @returns {Point2dType}    // RET: {x, y} in Canvas coordinates
     */
    function toCanvas(pt, xAxis, yAxis) {
        const x = int(map(pt.x, xAxis.minimum(), xAxis.maximum(), _left, _right - 1));
        const y = int(map(pt.y, yAxis.minimum(), yAxis.maximum(), _bottom - 1, _top));

        return Point(x, y);
    }

    /**
     * Map an (x,y) point from canvas coordinates to axis coordinates
     * 
     * @param {Point2dType} pt   // IN : {x, y} in Axis coordinates
     * @param {AxisType} xAxis       // IN : horizontal Axis
     * @param {AxisType} yAxis       // IN : vertical Axis
     * @returns {Point2dType}    // RET: {x, y} in Canvas coordinates
     */
    function toAxes(pt, xAxis, yAxis) {
        const x = map(pt.x, _left, _right - 1, xAxis.minimum(), xAxis.maximum());
        const y = map(pt.y, _bottom - 1, _top, yAxis.minimum(), yAxis.maximum());

        return Point(x, y);
    }

    /**
     * Draw a line on the chart.
     * 
     * @private
     * @param {Point2dType} p0 
     * @param {Point2dType} p1 
     */
    function _line(p0, p1) {
        //
        // line segment from p0 to p1
        //
        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(p0.x, p0.y);
        _context.lineTo(p1.x, p1.y);
        _context.stroke();
    }    

    /**
     * Draw a point on the chart.
     * 
     * @private
     * @param {Point2dType} pt 
     */
    function _point(pt) {
        _context.strokeStyle = _pointColor;
        _context.beginPath();
        _context.moveTo(pt.x - 1, pt.y - 1);
        _context.lineTo(pt.x + 1, pt.y - 1);
        _context.lineTo(pt.x + 1, pt.y + 1);
        _context.lineTo(pt.x - 1, pt.y + 1);
        _context.lineTo(pt.x - 1, pt.y - 1);
        _context.stroke();
    }

    /**
     * Draw text on the chart.
     * 
     * @private
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {CanvasTextAlign} align 
     * @param {CanvasTextBaseline} baseline 
     */
    function _drawText(text, x, y, align = 'center', baseline = 'middle') {
        _context.fillStyle = _textColor;
        _context.textAlign = align;
        _context.textBaseline = baseline;
        _context.fillText(text, x, y);
    }


    /**
     * Make sure the data iterator has hasNext() and next()
     * 
     * @param {Point2dIteratorType} dataIterator 
     */
    function _validateDataIterator(dataIterator) {
        //
        // make sure dataIterator is a valid iterator
        //
        if((!dataIterator.hasOwnProperty("hasNext")) || (typeof dataIterator.hasNext != "function")) {
            throw TypeError("dataIterator must have a hasNext method");
        }
        if((!dataIterator.hasOwnProperty("next")) || (typeof dataIterator.next != "function")) {
            throw TypeError("dataIterator must have a next method");
        }
    }

    /** @type {LineChartType} */
    const self = {
        "isContextAttached": isContextAttached,
        "attachContext": attachContext,
        "detachContext": detachContext,
        "setLineColor": setLineColor,
        "setPointColor": setPointColor,
        "setTextColor": setTextColor,
        "setChartArea": setChartArea,
        "autoSetChartArea": autoSetChartArea,
        "pointInChart": pointInChart,
        "toCanvas": toCanvas,
        "toAxes": toAxes,
        "plot": plot,
        "plotLine": plotLine,
        "plotPoints": plotPoints,
        "drawPoint": drawPoint,
        "drawHorizontal": drawHorizontal,
        "drawVertical": drawVertical,
        "drawText": drawText,
    } 

    return self;
}


/** 
 * Interface for a type that can paint on a canvas view
 * 
 * @typedef {Object} CanvasPainterType
 * @property {() => boolean} isCanvasAttached
 * @property {(canvas: HTMLCanvasElement) => CanvasPainterType} attachCanvas
 * @property {() => CanvasPainterType} detachCanvas
 * @property {() => CanvasPainterType} paint
*/

/// <reference path="../../../utilities/dom_utilities.js" />
/// <reference path="canvas_painter.js" />
/// <reference path="../../../utilities/message_bus.js" />

/**
 * @summary View controller for resizable, paintable canvas
 * @typedef {object} CanvasViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => CanvasViewControllerType} attachView
 * @property {() => CanvasViewControllerType} detachView
 * @property {() => boolean} isViewShowing
 * @property {() => CanvasViewControllerType} showView
 * @property {() => CanvasViewControllerType} hideView
 * @property {(force?: boolean) => CanvasViewControllerType} updateView
 * @property {() => boolean} isListening
 * @property {() => CanvasViewControllerType} startListening
 * @property {() => CanvasViewControllerType} stopListening
 * @property {(message: any, data: any, specifier?: string | undefined) => void} onMessage
 */

/**
 * @summary Construct view controller for resizable, paintable canvas.
 * 
 * @description
 * Construct view controller for resizable, paintable canvas.
 * When canvas is resized, it's coordinate system
 * is reset to the pixel coordinates and the canvasPainter
 * is called to repaint the canvas.
 * 
 * @param {string} cssContainer 
 * @param {string} cssCanvas 
 * @param {CanvasPainterType} canvasPainter 
 * @param {MessageBusType} messageBus
 * @param {string} updateMessage
 * @returns {CanvasViewControllerType}
 */
function CanvasViewController(cssContainer, cssCanvas, canvasPainter, messageBus, updateMessage) {
    /** @private @type {HTMLElement} The parent element of the HtmlCanvasElement. */
    let _container = undefined;

    /** @private @type {HTMLCanvasElement | undefined}  Canvas element to draw on. */
    let _canvas = undefined;

    /** @private @type {boolean} True if canvas must be redraw. */
    let _dirtyCanvas = true;

    /** @private @type {boolean} True if canvas was resized. */
    let _dirtySize = true;

    /** @type {number} */
    let _animationFrame = 0

    /** 
     * Synchronize the Canvas' size and the element's size so we are dealing with pixel coordinates. 
     * @private 
     * @type {() => void} 
     */
    const _setCanvasSize = () => {
        // make canvas coordinates match element size
        _canvas.width = _canvas.clientWidth;
        _canvas.height = _canvas.clientHeight;
    }

    /**
     * @summary Determine if controller is bound to DOM.
     * 
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    const isViewAttached = () => // RET: true if view is in attached state
    {
        return !!_container;
    }

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const attachView = () => {
        if (isViewAttached()) {
            console.log("Attempt to attach canvas view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);
        _canvas = _container.querySelector(cssCanvas);
        _setCanvasSize();

        canvasPainter.attachCanvas(_canvas);

        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * 
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const detachView = () => {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        _container = undefined;
        _canvas = undefined;

        canvasPainter.detachCanvas();

        return self;
    }

    let _listening = 0;

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    const isListening = () => {
        return _listening > 0;
    }

    /**
     * @summary Start listening for DOM events.
     * @description
     * This adds event listeners to attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const startListening = () => {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            _container.addEventListener("resize", _onResize);

            // 
            // if there is an update message,
            // then start listening for it.
            //
            if((!!messageBus) && (typeof updateMessage === "string")) {
                messageBus.subscribe(updateMessage, self);
            }
        }

        if(isListening()) {
            _dirtySize = true;  // bit of a hack, but critical 
                                // for canvas to pickup initial
                                // size while it's tab container
                                // is visible; before tab controller
                                // initializes, which may hide it.
            _updateLoop(performance.now());
        }

        return self;
    }

    /**
     * @summary Stop listening for DOM events.
     * @description
     * This removes event listeners from attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const stopListening = () => {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {
            _container.removeEventListener("resize", _onResize);

            // 
            // stop listening for update message,
            //
            if((!!messageBus) && (typeof updateMessage === "string")) {
                messageBus.unsubscribe(updateMessage, self);
            }

            window.cancelAnimationFrame(_animationFrame);
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    /**
     * @summary Determine if the view is showing.
     * 
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    const isViewShowing = () => {
        return _showing > 0;
    }

    /**
     * @summary Show/Enable the view.
     * 
     * @description
     * Show the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const showView = () => {
        _showing += 1;
        if (1 === _showing) {
            _dirtySize = true;
            show(_container);
        }
        return self;
    }

    /**
     * @summary Hide/Disable the view.
     * 
     * @description
     * Hide the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const hideView = () => {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * @summary Update view state and render if changed.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const updateView = (force = false) => {
        if(force || _dirtyCanvas) {
            canvasPainter.paint();
            _dirtyCanvas = false;
        }
        return self;
    }

    /**
     * @summary Update the canvas pixel coordinates
     * when the canvas changes size.
     * 
     * @param {boolean} force // true to force update
     * @returns {boolean}     // true if updated, false if not
     */
    const _updateSize = (force = false) => {
        if(force || _dirtySize) {
            _setCanvasSize();
            _dirtyCanvas = true;    // force a redraw
            _dirtySize = false;
            return true;
        }
        return false;
    }

    /**
     * @summary Event handler called when container resized.
     * 
     * @description
     * This event handler is called with the canvas container 
     * is resized.  It calls _updateSize() to update
     * the canvas pixel coordinates.
     * 
     * @param {Event} event 
     */
    const _onResize = (event) => {
        _updateSize(true);
    }

    /**
     * @summary Handle update message
     * 
     * @description
     * Called with update message, which
     * causes the view to be dirtied so
     * that it is redrawn on the next
     * animation frame.
     * 
     * @param {*} message 
     * @param {*} data 
     * @param {string | undefined} specifier
     */
    const onMessage = (message, data, specifier = undefined) => {
        if(message === updateMessage) {
            // mark canvas as dirty
            _dirtyCanvas = true;
        }
    }

    /**
     * @summary Update view once per animation frame.
     * 
     * @param {number} timeStamp 
     */
    const _updateLoop = (timeStamp) => {
        _updateSize();  // resize before redrawing
        updateView();

        if (isListening()) {
            _animationFrame = window.requestAnimationFrame(_updateLoop);
        }
    }

    /** @type {CanvasViewControllerType} */
    const self = Object.freeze({
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
        "updateView": updateView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    });

    return self;
}
/// <reference path="../utilities/message_bus.js" />


///////////////// Web Socket for Rover Commands /////////////////
/**
 *  Web Socket for Rover Commands
 * 
 * @typedef {object} CommandSocketType
 * @property {() => boolean} isStarted
 * @property {() => boolean} isReady
 * @property {() => boolean} isSending
 * @property {() => string} getSending
 * @property {() => boolean} hasError
 * @property {() => string} getError
 * @property {() => void} clearError
 * @property {() => void} reset
 * @property {(textCommand: string, force?: boolean) => boolean} sendCommand
 * @property {() => void} start
 * @property {() => void} stop
 */

/**
 * Web Socket for Rover Commands
 * @param {string} hostname 
 * @param {number} port 
 * @param {MessageBusType} messageBus 
 * @returns {CommandSocketType}
 */
function CommandSocket(hostname, port=82, messageBus = undefined) {
    //
    // stream images via websocket port 81
    //
    var socket = null;

    /**
     * Determine if socket is started.
     * 
     * @returns {boolean}
     */
    function isStarted() {
        return !!socket;
    }

    /**
     * Determine if socket is open and ready.
     * 
     * @returns {boolean}
     */
    function isReady() {
        return socket && (WebSocket.OPEN === socket.readyState);
    }

    //
    // while a command is sent, but not acknowledged
    // isSending() is true and getSending() is the command
    //
    let _sentCommand = "";

    /**
     * Determine if a message is being sent, 
     * but has not yet been acknowledged.
     * 
     * @returns {boolean}
     */
    function isSending() {
        return "" !== _sentCommand;
    }

    /**
     * If isSending() is true, then this returns
     * the command that is being sent, otherwise
     * it returns the empty string.
     * 
     * @returns {string} // RET: command name if isSending() is true,
     *                           empty string if isSending() is false.
     */
    function getSending() {
        return _sentCommand;
    }

    //
    // If a command is not acknowledged, then
    // isError() is true and getError() is the error
    // message returned by the server is and 'ERROR()' frame.
    //
    let _errorMessage = "";

    /**
     * Determine if there was an error.
     * 
     * @returns {boolean} // RET: true if there was an error.
     */
    function hasError() {
        return "" !== _errorMessage;
    }

    /**
     * Get the error message.
     * 
     * @returns {string}  // RET: if hasError() is true, then this returns the error message
     *                            if hasError() is false, then this returns the empty string.
     */
    function getError() {
        return _errorMessage;
    }

    /**
     * clear the sending and error state
     * so we can send another message.
     */
    function clearError() {
        _sentCommand = "";
        _errorMessage = "";
    }

    /**
     * Reset the socket connection
     */
    function reset() {
        stop();
        start();
        clearError();
    }

    /**
     * Send a command across the websocket.
     * 
     * If the socket is not ready (isReady() === false) 
     * then the message will not be sent unless force === true.
     * If there is already a message in the process of being send (isSending() === true)
     * then the message will not be sent unless force === true.
     * If there is a prior error (isError() === true) 
     * then the message will not be sent unless force === true.
     * 
     * Prior to call sendCommand() isSending() should be checked to make sure
     * there is not an command in flight.
     * Prior to calling sendCommand() isError() should be called to see if there
     * is a prior error that would block sending.  If so the error should be handled
     * or it should be cleared with a call to clearError().
     * 
     * @param {string} textCommand // IN : message to send.
     * @param {boolean} force      // IN : ignore any prior send or error.
     * @returns {boolean}          // RET: true if command sent,
     *                                     false if command was not sent.
     *                                     If it was not sent because another message
     *                                     is being sent (isSending() is true) or
     *                                     because there was a prior error that has not
     *                                     been cleared
     *                                     in which case getError() will have the error message.
     */
    function sendCommand(textCommand, force = false) {

        if(!force) {
            // make sure we have completed last send
            if(!isReady()) return false;
            if(isSending()) return false;
            if(hasError()) return false;
        }

        if(!textCommand) {
            _errorMessage = "ERROR(empty)"
            return false;
        }

        try {
            console.log("CommandSocket.send: " + textCommand);
            socket.send(_sentCommand = textCommand);
            return true;
        } 
        catch(error) {
            console.log("CommandSocket error: " + error);
            _errorMessage = `ERROR(${error})`;
            return false;
        }
    }

    /**
     * @summary Start the websocket.
     * @description
     * Create a new websocket and register handlers on it.
     * If the websocket started then isStarted() will return true.
     */
    function start() {
        socket = new WebSocket(`ws://${hostname}:${port}/command`, ['arduino']);
        socket.binaryType = 'arraybuffer';

        try {
            socket.onopen = function () {
                console.log("CommandSocket opened");
            }

            socket.onmessage = function (msg) {
                if("string" === typeof msg.data) {
                    if(msg.data.startsWith("log(")) {
                        // just reflect logs to the console for now
                        console.log(`CommandSocket: ${msg.data}`);
                    } else if(msg.data.startsWith("tel(")) {
                        // reflect telemetry to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out the telemetry packet and publish it
                        if(messageBus) {
                            const telemetry = JSON.parse(msg.data.slice(4, msg.data.lastIndexOf(")")));    // skip 'tel('
                            messageBus.publish("telemetry", telemetry);
                        }
                    } else if(msg.data.startsWith("pose(")) {
                        // reflect pose to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out pose change and publish it
                        if(messageBus) {
                            const pose = JSON.parse(msg.data.slice(5, msg.data.lastIndexOf(")")));    // skip 'pose('
                            messageBus.publish("pose", pose);
                        }
                    } else if(msg.data.startsWith("goto(")) {
                        // reflect pose to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out pose change and publish it
                        if(messageBus) {
                            // like: '{"goto":{"x":-300.000000,"y":0.000000,"a":3.141593,"state":"ACHIEVED","at":707869}}'
                            const gotoGoal = JSON.parse(msg.data.slice(5, msg.data.lastIndexOf(")")));    // skip 'goto('
                            messageBus.publish("goto", gotoGoal);
                        }
                    } else if(msg.data.startsWith("set(")) {
                        // reflect settings to console
                        console.log(`CommandSocket: ${msg.data}`);

                        // parse out setting change and publish it
                        if(messageBus) {
                            const setting = JSON.parse(msg.data.slice(4, msg.data.lastIndexOf(")")));    // skip 'set('
                            messageBus.publish("set", setting);
                        }
                    } else if(msg.data.startsWith("cmd(") && isSending()) {
                        // this should be the acknowledgement of the sent command
                        if(_sentCommand === msg.data) {
                            console.log(`CommandSocket: ${_sentCommand} Acknowledged`);
                            _sentCommand = "";   // SUCCESS, we got our command ack'd
                        } else {
                            console.log(`CommandSocket: ${_sentCommand} Not Acknowledged: ${msg.data}`);
                            _errorMessage = `ERROR(${msg})`;
                        }
                    } else {
                        console.log(`CommandSocket received unexpected text message: ${msg.data}`);
                    }
                } else {
                    console.warn("CommandSocket received unexpected binary message.");
                }
            };

            socket.onclose = function () {
                console.log("CommandSocket closed");
                socket = null;
            }
        } catch (exception) {
            console.log("CommandSocket exception: " + exception);
        }
    }

    /**
     * @summary Stop and close the websocket
     */
    function stop() {
        if (socket) {
            if ((socket.readyState !== WebSocket.CLOSED) && (socket.readyState !== WebSocket.CLOSING)) {
                socket.close();
            }
            socket = null;
        }
    }

    /** @type {CommandSocketType} */
    const self = Object.freeze({
        "start": start,
        "stop": stop,
        "isStarted": isStarted,
        "reset": reset,
        "isReady": isReady,
        "sendCommand": sendCommand,
        "isSending": isSending,
        "getSending": getSending,
        "hasError": hasError,
        "getError": getError,
        "clearError": clearError,
    });

    return self;
}
/// <reference path="command_socket.js" />

/** @typedef {'stop'|'forward'|'reverse'|'left'|'right'} TurtleCommandName */

/**
 * @summary A rover command processor.
 * @description
 * This maintains a queue of command to send 
 * and will send one per animation frame until
 * the queue is empty or an error occurs.  Senders
 * can subscribe to messages to track the status
 * of their commands; this is important because
 * errors must be cleared before the rest of
 * the queue can be processed.
 * This has functions to:
 * - format commands
 * - queue commands
 * - send commands to rover.
 * - clear errors
 * - reset the queue and/or websocket
 * 
 * @typedef {object} RoverCommanderType
 * @property {() => boolean} isStarted
 * @property {() => RoverCommanderType} start
 * @property {() => RoverCommanderType} stop
 * @property {() => boolean} isReady
 * @property {() => boolean} isSending
 * @property {() => string} getSending
 * @property {() => boolean} hasError
 * @property {() => string} getError
 * @property {() => RoverCommanderType} clear
 * @property {() => RoverCommanderType} reset
 * @property {() => void} halt
 * @property {(s: string) => boolean} isTurtleCommandName
 * @property {(wheels: number, 
 *             useSpeedControl: boolean, 
 *             minSpeed: number, maxSpeed: number, 
 *             Kp: number, Ki: number, Kd: number) 
 *             => void} syncSpeedControl
 * @property {(motorOneStall: number, motorTwoStall: number) => void} syncMotorStall
 * @property {(throttleValue: number, steeringValue: number, 
 *             throttleFlip: boolean, steeringFlip: boolean, 
 *             throttleZero: number, steeringZero: number) 
 *             => boolean} sendJoystickCommand
 * @property {(leftValue: number, rightValue: number, 
 *             leftFlip?: boolean, rightFlip?: boolean, 
 *             leftZero?: number, rightZero?: number) 
 *             => boolean} sendTankCommand
 * @property {() => boolean} sendHaltCommand
 * @property {() => boolean} sendResetPoseCommand
 * @property {(x: number, y: number, tolerance: number, pointForward: number) => boolean} sendGotoGoalCommand
 * @property {(command: TurtleCommandName, speedPercent: number) => void} enqueueTurtleCommand
 * @property {() => void} processTurtleCommand
 * @property {(command: TurtleCommandName, speedFraction: number) => boolean} sendTurtleCommand
 */

/**
 * @summary Construct a rover command processor.
 * @description
 * This maintains a queue of command to send 
 * and will send one per animation frame until
 * the queue is empty or an error occurs.  The
 * command processor takes a command socket as
 * a dependency; the command socket with publish
 * messages regarding the status of messages,
 * so the sender can determine if their command
 * succeeded or failed.
 * Errors must be cleared before the rest of
 * the queue can be processed.
 * This has functions to:
 * - format commands
 * - queue commands
 * - send commands to rover.
 * - clear errors
 * - reset the queue and/or websocket
 * 
 * @param {string} host 
 * @param {CommandSocketType} commandSocket 
 * @returns {RoverCommanderType}
 */
///////////// Rover Command ////////////////
function RoverCommand(host, commandSocket) {
    let running = false;
    let lastCommand = "";
    let commandCount = 0;
    let _useSpeedControl = false;
    let _minSpeed = 0;
    let _maxSpeed = 0;
    let _started = false;
    let _leftStall = 0;
    let _rightStall = 0;

    /**
     * @summary Determine if rover commander is running.
     * 
     * @returns {boolean}
     */
    function isStarted() {
        return _started;
    }

    let _requestAnimationFrameNumber = 0;

    /**
     * @summary Start processing commands.
     * @description
     * Start the command processing loop.  
     * 
     * @returns {RoverCommanderType} // RET: this command processor for fluent chain calling.
     */
    function start() {
        _started = true;
        _requestAnimationFrameNumber = window.requestAnimationFrame(_processingLoop);
        return self;
    }

    /**
     * @summary Stop processing commands.
     * @description
     * Stop the command processing loop.
     * 
     * @returns {RoverCommanderType} // RET: this command processor for fluent chain calling.
     */
    function stop() {
        _started = false;
        window.cancelAnimationFrame(_requestAnimationFrameNumber);
        return self;
    }

    /**
     * @summary Start the processing loop.
     * @description
     * While isStarted() is true, this will be 
     * called on each animation frame to process the command queue.
     * 
     * @param {number} timeStamp 
     */
    function _processingLoop(timeStamp) {
        _processCommands();
        if (isStarted()) {
            window.requestAnimationFrame(_processingLoop);
        }
    }

    const _turtleCommands = ['stop','forward','reverse','left','right'];

    /**
     * @summary Determine if string is a rover movement command.
     * 
     * @param {string} s 
     * @return {boolean}
     */
    function isTurtleCommandName(s) {
        // 'stop'|'forward'|'reverse'|'left'|'right'
        return _turtleCommands.includes(s)
    }

    /**
     * @summary Determine if command socket is ready.
     * @returns {boolean}
     */
    function isReady() {
        return commandSocket && commandSocket.isReady();
    }

    /**
     * @summary Determine if command is sending but not acknowledged.
     * 
     * @description
     * While a command is being sent, but not yet acknowledged, 
     * isSending() is true and getSending() is the command.
     * 
     * @returns {boolean}
     */
    function isSending() {
        return commandSocket && commandSocket.isSending();
    }

    /**
     * @summary Get the sending command.
     * 
     * @description
     * While a command is being sent, but not yet acknowledged, 
     * isSending() is true and getSending() is the command.
     * 
     * @returns {string} // RET: command if isSending() is true,
     *                           otherwise the blank string.
     */
    function getSending() {
        return commandSocket ? commandSocket.getSending() : "";
    }

    /**
     * @summary Determine if command has errored.
     * 
     * @description
     * If a sent command is not acknowledged, then
     * hasError() becomes true and getError() is the error
     * message returned by the server in an 'ERROR()' frame.
     * 
     * @returns {boolean}
     */
    function hasError() {
        return commandSocket && commandSocket.hasError();
    }

    /**
     * @summary Get command error.
     * 
     * @description
     * If a sent command is not acknowledged, then
     * hasError() becomes true and getError() is the error
     * message returned by the server in an 'ERROR()' frame.
     * 
     * @returns {string} // RET: if hasError() is true then the error message
     *                           otherwise the blank string.
     */
    function getError() {
        return commandSocket ? commandSocket.getError() : "";
    }

    /**
     * @summary clear the sending error state
     * 
     * @description
     * If there is an error, then it must be cleared
     * before any further commands can be sent.
     * This clears the error state if one exists.
     * 
     * @returns {RoverCommanderType} // RET: this command processor for fluent chain calling.
     */
    function clear() {
        if (commandSocket) {
            commandSocket.clearError();
        }
        return self;
    }

    /**
     * @summary Reset the socket connection.
     * 
     * @description
     * This stops the socket and reopens it.
     * Any in-flight command is dropped and
     * any error is cleared.
     * 
     * @returns {RoverCommanderType} // RET: this command processor for fluent chain calling.
     */
    function reset() {
        if (commandSocket) {
            commandSocket.reset();
        }
        return self;
    }

    /**
     * @summary Clear command queue and stop rover.
     * 
     * @description
     * This sends the halt command to the rover,
     * then waits for all pending commands to be processed.
     */
    function halt() {
        sendHaltCommand();
        while(_pendingCommands()) {
            _processCommands()
        }
    }


    /**
     * @summary Set speed control and send it to rover.
     * 
     * @description
     * If we are changing control modes, then first halt the rover, 
     * then send the speed control command.  isSending()
     * and hasError() can be used to check the progress.
     * 
     * @param {number} wheels           // IN : bits designating which wheels this command applies to
     * @param {boolean} useSpeedControl // IN : true if speed control is enabled, false otherwise 
     * @param {number} minSpeed         // IN : minimum measured speed below which motor stalls
     * @param {number} maxSpeed         // IN : maximum measured speed
     * @param {number} Kp               // IN : proportional gain
     * @param {number} Ki               // IN : integral gain
     * @param {number} Kd               // IN : derivative gain
     */
    function syncSpeedControl(wheels, useSpeedControl, minSpeed, maxSpeed, Kp, Ki, Kd) {
        //
        // if we are changing control modes 
        // then we stop and clear command queue.
        //
        if(_useSpeedControl != useSpeedControl) {
            halt();
        }

        //
        // if we are using speed control, all
        // parameters must be present and valid
        //
        if(!!(_useSpeedControl = useSpeedControl)) {
            assert(isValidNumber(wheels, 1, 3))
            assert(isValidNumber(minSpeed, 0));
            assert(isValidNumber(maxSpeed, minSpeed, undefined, true));
            assert(isValidNumber(Kp));
            assert(isValidNumber(Ki));
            assert(isValidNumber(Kd));

            //
            // use the smallest maxSpeed and largest minSpeed 
            // so that we stay within limits of all wheels
            // when issuing speed commands.
            //
            _minSpeed = (_minSpeed > 0) ? max(_minSpeed, minSpeed) : minSpeed;
            _maxSpeed = (_maxSpeed > 0) ? min(_maxSpeed, maxSpeed) : maxSpeed;

            // tell the rover about the new speed parameters
            _enqueueCommand(_formatSpeedControlCommand(int(wheels), minSpeed, maxSpeed, Kp, Ki, Kd), true);
        } else {
            // turning off speed control
            _minSpeed = 0;
            _maxSpeed = 0;
        }
    }

    /**
     * Format a speed control command for sending over websocket.
     * 
     * @private
     * @param {number} wheels           // IN : bits designating which wheels this command applies to
     * @param {number} minSpeed         // IN : minimum measured speed below which motor stalls
     * @param {number} maxSpeed         // IN : maximum measured speed
     * @param {number} Kp               // IN : proportional gain
     * @param {number} Ki               // IN : integral gain
     * @param {number} Kd               // IN : derivative gain
     * @returns {string}                // RET: formatted command string
     */
    function _formatSpeedControlCommand(wheels, minSpeed, maxSpeed, Kp, Ki, Kd) {
        return `pid(${wheels}, ${minSpeed}, ${maxSpeed}, ${Kp}, ${Ki}, ${Kd})`;
    }

    /**
     * @summary Send motor stall command. 
     * 
     * @description
     * Format and enqueue a motor stall command
     * to set the fraction of max pwm where the
     * motor will stall.
     * Use isSending() and hasError() to check
     * the progress of the command sending.
     * 
     * @param {number} motorOneStall // 0 to 1 fraction of max pwm
     * @param {number} motorTwoStall // 0 to 1 fraction of max pwm
     */
    function syncMotorStall(motorOneStall, motorTwoStall) {
        // tell the rover about the new speed parameters
        _enqueueCommand(_formatMotorStallCommand(
            _leftStall = motorOneStall, 
            _rightStall = motorTwoStall),
            true    // configuration is high priority command
        );
    }

    /**
     * @summary Format a motor stall command.
     * 
     * @private
     * @param {number} motorOneStall // 0 to 1 fraction of max pwm
     * @param {number} motorTwoStall // 0 to 1 fraction of max pwm
     * @returns {string}             // RET: formatted command string
     */
    function _formatMotorStallCommand(motorOneStall, motorTwoStall) {
        return `stall(${motorOneStall}, ${motorTwoStall})`;
    }

    /**
     * @summary Format a goto goal command.
     * 
     * @param {number} x             // IN : goal x position
     * @param {number} y             // IN : goal y position
     * @param {number} tolerance     // IN : distance from goal for success
     * @param {number} pointForward  // IN : point forward as percentage of wheel base
     * @returns {string}             // RET: formatted command string
     */
    function _formatGotoGoalCommand(x, y, tolerance, pointForward) {
        return `goto(${x}, ${y}, ${tolerance}, ${pointForward})`
    }

    /**
     * @summary Send a turtle-style command to the rover.
     * 
     * @description
     * Send a turtle-style movement command to the rover;
     * stop, forward, reverse, left or right.
     * The command will actually be formatted as a
     * tank-style command and sent to the rover in that format.
     * 
     * @param {TurtleCommandName} command  // 'stop', 'forward', 'reverse', 'left', 'right'
     * @param {number} speedFraction       // float from 0.0 to 1.0, fraction of full throttle
     * @return {boolean}                   // true if command sent, false if not
     */
    function sendTurtleCommand(
        command,        
        speedFraction)  
    {
        speedFraction = constrain(speedFraction, 0.0, 1.0);

        switch(command) {
            case 'stop': {
                return sendTankCommand(0, 0);
            }
            case 'forward': {
                return sendTankCommand(speedFraction, speedFraction);
            }
            case 'reverse': {
                return sendTankCommand(-speedFraction, -speedFraction);
            }
            case 'left': {
                return sendTankCommand(-speedFraction, speedFraction);
            }
            case 'right': {
                return sendTankCommand(speedFraction, -speedFraction);
            }
            default: {
                console.error("sendTurtleCommand got unrecognized command: " + command);
                return false;
            }
        }
    }


    /**
     * @summary Send joystick movement command to the rover.
     * 
     * @description
     * Send a joystick-style movementcommand (throttle, steering) to the rover.
     * 
     * @param {number} throttleValue // float: joystick axis value -1.0 to 1.0
     * @param {number} steeringValue // float: joystick axis value -1.0 to 1.0
     * @param {boolean} throttleFlip // boolean: true to invert axis value, false to use natural axis value
     * @param {boolean} steeringFlip // boolean: true to invert axis value, false to use natural axis value
     * @param {number} throttleZero  // float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero)
     * @param {number} steeringZero  // float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero)
     * @return {boolean}             // true if command sent, false if not
     */
    function sendJoystickCommand(
        throttleValue, steeringValue,   
        throttleFlip, steeringFlip,    
        throttleZero, steeringZero)     
    {
        throttleValue = constrain(throttleValue, -1.0, 1.0);
        steeringValue = constrain(steeringValue, -1.0, 1.0);

        // apply zero area (axis zone near zero that we treat as zero)
        if(abs(throttleValue) <= throttleZero) {
            throttleValue = 0;
        }
        if(abs(steeringValue) <= steeringZero) {
            steeringValue = 0;
        }
        
        // apply flip
        if(throttleFlip) {
            throttleValue = -(throttleValue);
        }
        if(steeringFlip) {
            steeringValue = -(steeringValue);
        }

        // assume straight - not turn
        let leftValue = throttleValue;
        let rightValue = throttleValue;

        // apply steering value to slow one wheel to create a turn
        if(steeringValue >= 0) {
            // right turn - slow down right wheel
            rightValue *= 1.0 - steeringValue;
        } else {
            // left turn, slow down left wheel
            leftValue *= 1.0 + steeringValue;
        }

        // now we can use this as a tank command (we already applied flip and zero)
        return sendTankCommand(leftValue, rightValue);
    }

    /**
     * @summary Send a tank-style movement command to the rover.
     * 
     * @description
     * Send a tank-style (left wheel, right wheel) command to the rover.
     * 
     * @param {number} leftValue  // float: joystick axis value -1.0 to 1.0
     * @param {number} rightValue // float: joystick axis value -1.0 to 1.0
     * @param {boolean} leftFlip  // boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {boolean} rightFlip // boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {number} leftZero   // float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @param {number} rightZero  // float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @return {boolean}          // true if command sent, false if not
     */
    function sendTankCommand(
        leftValue, rightValue,  
        leftFlip = false, rightFlip = false,    
        leftZero = 0, rightZero = 0)    
    {
        // a zero (stop) command is high priority
        const tankCommand = _formatTankCommand(leftValue, rightValue, leftFlip, rightFlip, leftZero, rightZero);
        return _enqueueCommand(tankCommand, (abs(leftValue) <= leftZero) && (abs(rightValue) <= rightZero));
    }

    /**
     * @summary Send a halt command to the rover
     * 
     * @description
     * This will send the halt command to the rover,
     * which will stop the rover and and terminate
     * any running behavior (like goto goal behavior).
     * 
     * @return {boolean} // true if command sent, false if not
     */
    function sendHaltCommand() {
        // clear command buffer, make halt next command
        _commandQueue = [];
        return _enqueueCommand("halt()", true);
    }

    /**
     * @summary Send reset pose command to rover.
     * 
     * @description
     * Send the reset pose command to the rover which 
     * will reset the pose x, y, angle to (0, 0, 0).
     * 
     * @return {boolean} // true if command sent, false if not
     */
    function sendResetPoseCommand() {
        return _enqueueCommand("resetPose()", true);
    }

    /**
     * @summary Send the goto goal movement command to the rover.
     * 
     * @description
     * Send the goto goal movement command to the rover, which
     * will set a target (x, y) position that the rover will 
     * move to, along with a distance tolerance used to decide
     * if the rover has achieved the goal.
     * 
     * @param {number} x             // x position to achieve
     * @param {number} y             // y position to achieve
     * @param {number} tolerance     // distance from goal considered success
     * @param {number} pointForward  // unused
     * @returns 
     */
    function sendGotoGoalCommand(x, y, tolerance, pointForward) {
        return _enqueueCommand(_formatGotoGoalCommand(x, y, tolerance, pointForward));
    }

    /**
     * @summary Send a command string to the server
     * 
     * @description
     * Send a string command to the rover
     * - the command get's wrapped in a cmd() wrapper with a serial number
     * 
     * @private
     * @param {string} commandString 
     * @return {boolean} true if command sent, false if not
     */
    function _sendCommand(commandString)    
    {
        if(commandSocket) {
            if(commandSocket.isStarted()) {
                if(commandSocket.isReady()) {
                    if(commandSocket.hasError()) {
                        commandSocket.clearError();
                        lastCommand = "";   // clear last command sent before error so can send it again.
                    }
                    if(!commandSocket.isSending()) {
                        if(commandString == lastCommand) {
                            return true;    // no need to execute it again
                        }
                        const commandWrapper = `cmd(${commandCount}, ${commandString})`
                        if(commandSocket.sendCommand(commandWrapper)) {
                            lastCommand = commandString;
                            commandCount += 1;
                            return true;
                        }
                    }
                }
            } else {
                // restart the command socket
                commandSocket.reset();
                lastCommand = "";   // clear last command sent before error so can send it again.
            }
        }

        return false;
    }


    /**
     * Send a tank-style (left wheel, right wheel) command to the rover.
     * Wheel values (-1.0..1.0) are used to scale output values against maximums.
     * If using speed control, then values of (0..maxSpeed) are output.
     * If not using speed control, then pwm values of (0..255) are output.
     * 
     * @private
     * @param {number} leftValue  : float: joystick axis value -1.0 to 1.0
     * @param {number} rightValue : float: joystick axis value -1.0 to 1.0
     * @param {boolean} leftFlip  : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {boolean} rightFlip : boolean: true to invert axis value, false to use natural axis value. Default is true.
     * @param {number} leftZero   : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     * @param {number} rightZero  : float: value 0.0 to 1.0 for zero area of axis (values at or below are considered zero). Default is zero.
     */
    function _formatTankCommand(
        leftValue, rightValue,  
        leftFlip = false, rightFlip = false,    
        leftZero = 0, rightZero = 0)    
    {
        leftValue = constrain(leftValue, -1.0, 1.0);
        rightValue = constrain(rightValue, -1.0, 1.0);

        // apply flip
        if(leftFlip) {
            leftValue = -(leftValue);
        }
        if(rightFlip) {
            rightValue = -(rightValue);
        }

        // 
        // scale the output value between zero-value and 1.0.
        // - output is pwm if not using speed control (0..255)
        // - output is speed if using speed control (0..maxSpeed)
        //
        let leftCommandValue = 0; 
        if(abs(leftValue) > leftZero) {
            if(_useSpeedControl) {
                // map axis value from minSpeed to maxSpeed
                leftCommandValue = parseFloat(map(abs(leftValue), leftZero, 1.0, _minSpeed, _maxSpeed).toFixed(4));
            } else { 
                // map axis value from stallValue to max engine value (255)
                leftCommandValue = int(map(abs(leftValue), leftZero, 1.0, int(_leftStall * 255), 255));
            }
        }
        let rightCommandValue = 0; 
        if(abs(rightValue) > rightZero) {
            if(_useSpeedControl) {
                // map axis value from minSpeed to maxSpeed
                rightCommandValue = parseFloat(map(abs(rightValue), rightZero, 1.0, _minSpeed, _maxSpeed).toFixed(4));
            } else {
                // map axis value from stallValue to max engine value (255)
                rightCommandValue = int(map(abs(rightValue), rightZero, 1.0, int(_rightStall * 255), 255));
            }
        }

        
        // format command
        if(_useSpeedControl) {
            return `speed(${leftCommandValue}, ${leftValue > 0}, ${rightCommandValue}, ${rightValue > 0})`;
        } else {
            return `pwm(${leftCommandValue}, ${leftValue > 0}, ${rightCommandValue}, ${rightValue > 0})`;
        }
    }

    //
    // command queue
    //
    let _commandQueue = [];
    let _highPriorityQueue = false;  // true if queue should only have high priority commands
    /**
     * Insert a command into the command queue.
     * If the command is high priority, all low
     * priority commands are removed from the 
     * queue and no low priority commands will
     * be queued until all high priority commands 
     * are sent.
     * 
     * @private
     * @param {string} command       // IN : command to queue
     * @param {boolean} highPriority // IN : the command is high priority
     * @return {boolean}             // RET: true if command queued, 
     *                                       false if not
     */
    function _enqueueCommand(command, highPriority=false) {
        if(typeof command == "string") {
            // don't bother enqueueing redudant commands
            // if((0 == _commandQueue.length) 
            //     || (command != _commandQueue[_commandQueue.length - 1]))

            if(_highPriorityQueue) {
                //
                // if we have a high priority queue, 
                // don't add low priority items to it
                //
                if(!highPriority) {
                    return false; 
                }
            } else {    // !_highPriorityQueue
                // 
                // if we are switching from low priority to high priority
                // then clear the low priority commands from the queue
                //
                if(highPriority) {
                    _commandQueue = [];
                }
            }

            if(highPriority || (0 == _commandQueue.length)) {
                _commandQueue.push(command);
            } else if(!_highPriorityQueue) {
                _commandQueue[0] = command;     // only bother with latest low priority command
            }
            _highPriorityQueue = highPriority;
            return true;
        }
        return false;
    }

    /**
     * @summary Determine if there are any commands in the command queue
     * 
     * @private
     * @returns {boolean} - // RET: true if there is at least one 
     *                      //      command in the command queue.
     *                      //      false if the command queue is empty.
     */
    function _pendingCommands() {
        return _commandQueue.length > 0;
    }

    /**
     * @summary Send the next command in the command queue.
     * 
     * @returns {boolean} : true if a command was sent
     *                      false is command was not sent
     */
    function _processCommands() {
        if(_commandQueue.length > 0) {
            const command = _commandQueue.shift();
            if(typeof command == "string") {
                if(_sendCommand(command)) {
                    if(0 == _commandQueue.length) {
                        // we emptied the queue, so it can now take low priority items
                        _highPriorityQueue = false;
                    }
                    return true;
                }
                // put command back in queue
                _commandQueue.unshift(command)
            }
        }
        return false;
    }

    //
    /////////////// turtle command queue  /////////////////
    //
    let commands = [];
    let speeds = [];

    /**
     * @summary Add a turtle command to turtle queue.
     * 
     * @description
     * The turtle queue contains a set of turtle
     * command to execute.  As it is processed,
     * each turtle command is formatted into 
     * a tank-style command and added to the 
     * regular command queue where it is actually
     * sent to the rover.
     * 
     * @param {TurtleCommandName} command 
     * @param {number} speedPercent 
     */
    function enqueueTurtleCommand(command, speedPercent) {
        //
        // don't add redundant commands
        //
        if ((0 === commands.length) || (command !== commands[commands.length - 1])) {
            commands.push(command); // add to end of command buffer
            speeds.push(speedPercent / 100); // convert to 0.0 to 1.0
        } else {
            // command is already queued, no need for a second one
            console.log(`command ${command} not pushed: ${command} is already buffered.`);
        }
        processTurtleCommand(); // send next command in command queue
    }

    /**
     * @summary Process one command from the turtle command queue.
     * 
     * @description
     * This pulls a turtle command from the turtle queue
     * then formats it as a tank-style command and 
     * adds it to the standard command queue, where
     * it will be processed for sending to the rover.
     */
    function processTurtleCommand() {
        if (0 === commands.length) {
            return; // nothing to do
        }

        const command = commands.shift();
        const speed = speeds.shift();

        if(! sendTurtleCommand(command, speed)) {
            // put command back in queue so we can try again later
            commands.unshift(command);
            speeds.unshift(speed);
        }
    }

    /** @type {RoverCommanderType} */
    const self = Object.freeze({
        "isStarted": isStarted,
        "start": start,
        "stop": stop,
        "isReady": isReady,
        "isSending": isSending,
        "getSending": getSending,
        "hasError": hasError,
        "getError": getError,
        "reset": reset,
        "clear": clear,
        "halt": halt,
        "isTurtleCommandName": isTurtleCommandName,
        "enqueueTurtleCommand": enqueueTurtleCommand,
        "processTurtleCommand": processTurtleCommand,
        "sendTurtleCommand": sendTurtleCommand,
        "sendJoystickCommand": sendJoystickCommand,
        "sendTankCommand": sendTankCommand,
        "sendHaltCommand": sendHaltCommand,
        "sendResetPoseCommand": sendResetPoseCommand,
        "syncSpeedControl": syncSpeedControl,
        "syncMotorStall": syncMotorStall,
        "sendGotoGoalCommand": sendGotoGoalCommand,
    });

    return self;
}/// <reference path="../telemetry_model_listener.js" />
/// <reference path="../../view/widget/canvas/plot.js" />
/// <reference path="../../view/widget/canvas/canvas_painter.js" />

/**
 * Construct canvas painter that draw telemetry line charts.
 * 
 * @param {TelemetryListenerType} poseTelemetry 
 * @returns {CanvasPainterType}
 */
function PoseCanvasPainter(poseTelemetry) {
    const xAxis = Axis();
    const yAxis = Axis();
    const lineChart = LineChart();
    let _canvas = undefined;
    const _left = 20;
    const _right = 20;
    const _top = 10;
    const _bottom = 20;
    const _backgroundColor = "gainsboro";

    /**
     * @summary Determine if painter is bound to canvas element.
     * @returns {boolean}
     */
    function isCanvasAttached() {
        return !!_canvas;
    }

    /**
     * @summary Bind to a canvas element
     * 
     * @param {HTMLCanvasElement} canvas  // IN : canvas element with 2DContext 
     * @returns {CanvasPainterType}       // RET: this canvas painter instance
     */
    function attachCanvas(canvas) {
        _canvas = canvas;

        return self;
    }

    /**
     * Unbind from canvas element.
     * 
     * @returns {CanvasPainterType} // RET: this canvas painter for fluent chain calling.
     */
    function detachCanvas() {
        _canvas = null;

        return self;
    }

    function paint() {
        if(isCanvasAttached()) {
            let context = _canvas.getContext("2d");

            // clear entire canvas
            context.fillStyle = config.chartBackgroundColor();
            context.fillRect(0, 0, _canvas.width, _canvas.height);

            //
            // area of chart
            //
            const borders = ChartUtils.calcBorders(context, xAxis.tickLength());
            const left = borders.left;
            const right = _canvas.width - borders.right;
            const top = borders.top;
            const bottom = _canvas.height - borders.bottom;
    
            //
            // set axes bounds
            //
            xAxis.attachContext(context).setChartArea(left, top, right, bottom);
            yAxis.attachContext(context).setChartArea(left, top, right, bottom);
                    
            // 
            // draw axes
            //
            xAxis.setLineColor(config.chartAxisColor()).drawTopAxis().drawBottomAxis().drawBottomTicks();
            yAxis.setLineColor(config.chartAxisColor()).drawRightAxis().drawLeftAxis().drawLeftTicks();

            if((poseTelemetry.count() > 0)) {
                // 
                // draw chart
                //
                lineChart.attachContext(context).setChartArea(left, top, right, bottom);

                //
                // Set data range for each axis.
                // Use a square aspect ratio.
                // 
                const xMinimum = poseTelemetry.minimum("x");
                const xMaximum = poseTelemetry.maximum("x");
                const xRange = xMaximum - xMinimum;
                const yMinimum = poseTelemetry.minimum("y");
                const yMaximum = poseTelemetry.maximum("y");
                const yRange = yMaximum - yMinimum;
                
                const canvasWidth = right - left;
                const canvasHeight = bottom - top;
                const xDistancePerPixel = xRange / canvasWidth;   
                const yDistancePerPixel = yRange / canvasHeight;  
                const distancePerPixel = max(xDistancePerPixel, yDistancePerPixel);

                // set distance based on distancePerPixel and aspect ratio
                const xWidth = canvasWidth * distancePerPixel;
                xAxis.setMinimum(xMinimum);
                xAxis.setMaximum(xAxis.minimum() + xWidth);
                const yHeight = canvasHeight * distancePerPixel;
                yAxis.setMinimum(yMinimum);
                yAxis.setMaximum(yAxis.minimum() + yHeight);

                // draw zero axes
                lineChart.setLineColor(config.chartAxisColor());
                lineChart.drawHorizontal(0, xAxis, yAxis, 3, 3);
                lineChart.drawVertical(0, xAxis, yAxis, 3, 3);
                yAxis.drawLeftText("0", 0);
                xAxis.drawTopText("0", 0);

                // (x, y) value
                lineChart.setLineColor(config.poseLineColor()).plotLine(Point2dIterator(poseTelemetry), xAxis, yAxis);
                lineChart.setPointColor(config.posePointColor()).drawPoint(poseTelemetry.last(), xAxis, yAxis);

                // done
                lineChart.detachContext();

                // draw current position and orientation on bottom
                const currentPose = poseTelemetry.last();
                xAxis.drawBottomText(
                    `(${currentPose.x.toFixed(2)}, ${currentPose.y.toFixed(2)}, ${currentPose.a.toFixed(2)}`, 
                    xAxis.mid());
            } else {
                xAxis.setMinimum(0).setMaximum(1);
                yAxis.setMinimum(-1).setMaximum(1);
            }
            
            xAxis.drawBottomText(`${xAxis.minimum().toFixed(1)}`, xAxis.minimum());
            xAxis.drawBottomText(`${xAxis.maximum().toFixed(1)}`, xAxis.maximum());
            yAxis.drawLeftText(`${yAxis.minimum().toFixed(1)}`, yAxis.minimum());
            yAxis.drawLeftText(`${yAxis.maximum().toFixed(1)}`, yAxis.maximum());

            // done and done
            xAxis.detachContext();
            xAxis.detachContext();    
        }
        return self;
    }

    /** @type {CanvasPainterType} */
    const self = {
        "isCanvasAttached": isCanvasAttached,
        "attachCanvas": attachCanvas,
        "detachCanvas": detachCanvas,
        "paint": paint,
    }

    return self;
}
/// <reference path="../../view/widget/canvas/plot.js" />
/// <reference path="../../view/widget/canvas/canvas_painter.js" />
/// <reference path="../../calibration/pid/speed_control_model.js" />
/// <reference path="../telemetry_listener.js" />


/**
 * Construct canvas painter that draws telemetry line charts.
 * 
 * @param {TelemetryListenerType} leftTelemetry 
 * @param {TelemetryListenerType} rightTelemetry 
 * @param {SpeedControlModelType} speedControl 
 * @returns {CanvasPainterType}
 */
function TelemetryCanvasPainter(leftTelemetry, rightTelemetry, speedControl) {
    const pwmAxis = Axis();
    const speedAxis = Axis();
    const timeAxis = Axis();
    const lineChart = LineChart();

    /** @type {HTMLCanvasElement} */
    let _canvas = undefined;
    const _left = 20;
    const _right = 20;
    const _top = 10;
    const _bottom = 20;
    const _backgroundColor = "gainsboro";

    /**
     * Determine if we have attached to dom.
     * 
     * @returns {boolean}
     */
    function isCanvasAttached() {
        return !!_canvas;
    }

    /**
     * Bind to a dom canvas element
     * 
     * @param {HTMLCanvasElement} canvas  // IN : canvas with 2DContext 
     * @returns {CanvasPainterType}       // RET: for fluent chain calling.
     */
    function attachCanvas(canvas) {
        _canvas = canvas;

        return self;
    }

    /**
     * Detach from the dom canvas element.
     * 
     * @returns {CanvasPainterType} // RET: for fluent chain calling.
     */
    function detachCanvas() {
        _canvas = null;

        return self;
    }

    /**
     * Convert (forward, pwm) value from telemetry into a signed pwm value.
     * 
     * @param {WheelTelemetryType} value // IN : telemetry with pwm direction and value
     * @return {number}                  // RET: signed pwm value
     */
    function signedPwm(value) {
        return value.forward ? value.pwm : -value.pwm;
    }

    /**
     * Construct iterator that returns (timestamp, pwm) pairs.
     * 
     * @param {TelemetryListenerType} telemetry 
     * @returns {{
     *     hasNext: () => boolean,
     *     next: () => {
     *         x: number,  // timestamp
     *         y: number,  // signed pwm value
     *     }
     * }}
     */
    function PwmIterator(telemetry) {
        let i = 0;
        function hasNext() {
            return i < telemetry.count();
        }
        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: signedPwm(value),
                };
            }
            throw RangeError("PwmIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    /**
     * Construct iterator that produces (timestamp, speed) pairs
     * 
     * @param {TelemetryListenerType} telemetry 
     * @returns {{
     *     hasNext: () => boolean,
     *     next: () => {
     *         x: number,  // timestamp
     *         y: number,  // measured speed
     *     }
     * }}
     */
    function SpeedIterator(telemetry) {
        let i = 0;

        function hasNext() {
            return i < telemetry.count();
        }

        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: value.speed,
                };
            }
            throw RangeError("SpeedIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    /**
     * Construct iterator that produces (time, targetSpeed) pairs.
     * 
     * @param {TelemetryListenerType} telemetry 
     * @returns {{
     *     hasNext: () => boolean,
     *     next: () => {
     *         x: number,  // timestamp
     *         y: number,  // target speed
     *     }
     * }}
     */
    function TargetSpeedIterator(telemetry) {
        let i = 0;
        function hasNext() {
            return i < telemetry.count();
        }
        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: value.target,
                };
            }
            throw RangeError("TargetSpeedIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    /**
     * calculate average speed in the telemetry data
     * for last spanMs milliseconds.
     * 
     * 
     * @param {TelemetryListenerType} telemetry // IN : telemetry buffer
     * @param {number} spanMs                   // IN : time span in milliseconds
     * @returns {number}                        // RET: average speed over last spanMs milliseconds
     *                                                  or 0 if there is no data.
     */
    function averageSpeed(telemetry, spanMs) {
        if(telemetry.count() > 0) {
            let sum = 0;
            let n = 0;
            const limitMs = telemetry.last().at - spanMs;
            for(let i = telemetry.count() - 1; i >= 0; i -= 1) {
                const data = telemetry.get(i);
                if(data.at >= limitMs) {
                    sum += data.speed;
                    n += 1;
                } else {
                    break;  // rest of data is out of range
                }
            }

            return sum / n;
        }
        return 0;
    }

    /**
     * Paint on the attached canvas.
     * 
     * @returns {CanvasPainterType} // RET: self for fluent chain calling
     */
    function paint() {
        if(isCanvasAttached()) {
            let context = _canvas.getContext("2d");

            // clear entire canvas
            context.fillStyle = config.chartBackgroundColor();
            context.fillRect(0, 0, _canvas.width, _canvas.height);

            //
            // area of chart
            //
            const borders = ChartUtils.calcBorders(context, timeAxis.tickLength());
            const left = borders.left;
            const right = _canvas.width - borders.right;
            const top = borders.top;
            const bottom = _canvas.height - borders.bottom;
    
            //
            // set axes bounds
            //
            timeAxis.attachContext(context).setChartArea(left, top, right, bottom);
            speedAxis.attachContext(context).setChartArea(left, top, right, bottom);
            pwmAxis.attachContext(context).setChartArea(left, top, right, bottom);
                    
            // 
            // draw axes
            //
            timeAxis.setLineColor(config.chartAxisColor()).drawBottomAxis().drawBottomTicks();
            speedAxis.setLineColor(config.chartAxisColor()).drawLeftAxis().drawLeftTicks();
            pwmAxis.setLineColor(config.chartAxisColor()).drawRightAxis().drawRightTicks();

            //
            // trim all values that are outside the configured time window
            //
            const timeSpanMs = config.telemetryPlotMs();
            if(leftTelemetry.count() > 0) {
                leftTelemetry.trimBefore(leftTelemetry.last()["at"] - timeSpanMs);
            }
            if(rightTelemetry.count() > 0) {
                rightTelemetry.trimBefore(rightTelemetry.last()["at"] - timeSpanMs);
            }

            if((leftTelemetry.count() > 0) && (rightTelemetry.count() > 0)) {
                // 
                // draw chart
                //
                lineChart.attachContext(context).setChartArea(left, top, right, bottom);

                //
                // Set data range for time axis.
                // The duration is set in config, so choose the appropriate min and max
                //
                let minimumTimeMs = min(leftTelemetry.first()["at"], rightTelemetry.first()["at"]);
                timeAxis.setMinimum(minimumTimeMs).setMaximum(minimumTimeMs + timeSpanMs);

                // 
                // set speed axis range based on stats kept by telemetry.
                // 
                let minimumSpeed = 0
                minimumSpeed = min(minimumSpeed, leftTelemetry.minimum("speed"));
                minimumSpeed = min(minimumSpeed, rightTelemetry.minimum("speed"));
                minimumSpeed = min(minimumSpeed, leftTelemetry.minimum("target"));
                minimumSpeed = min(minimumSpeed, rightTelemetry.minimum("target"));
                if(minimumSpeed < 0) {
                    minimumSpeed = min(minimumSpeed, -max(speedControl.maximumSpeed("left"), speedControl.maximumSpeed("right")));
                }

                let maximumSpeed = 0
                maximumSpeed = max(maximumSpeed, leftTelemetry.maximum("speed"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("speed"));
                maximumSpeed = max(maximumSpeed, leftTelemetry.maximum("target"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("target"));
                if(maximumSpeed > 0) {
                    maximumSpeed = max(maximumSpeed, max(speedControl.maximumSpeed("left"), speedControl.maximumSpeed("right")));
                }

                speedAxis.setMinimum(minimumSpeed).setMaximum(maximumSpeed);

                // prefer zero for max or min unless range is on either side
                pwmAxis.setMinimum(-255).setMaximum(255);

                // draw zero speed
                lineChart.setLineColor(config.chartAxisColor()).drawHorizontal(0, timeAxis, speedAxis, 3, 3);
                speedAxis.drawLeftText("0", 0);

                // target speed
                lineChart.setLineColor(config.leftTargetColor()).setPointColor(config.leftTargetColor());;
                lineChart.plotLine(TargetSpeedIterator(leftTelemetry), timeAxis, speedAxis);
                lineChart.setLineColor(config.rightTargetColor()).setPointColor(config.rightTargetColor());
                lineChart.plotLine(TargetSpeedIterator(rightTelemetry), timeAxis, speedAxis);

                // measured speed
                lineChart.setLineColor(config.leftSpeedColor()).setPointColor(config.leftSpeedColor());
                lineChart.plotLine(SpeedIterator(leftTelemetry), timeAxis, speedAxis);
                lineChart.setLineColor(config.rightSpeedColor()).setPointColor(config.rightSpeedColor());
                lineChart.plotLine(SpeedIterator(rightTelemetry), timeAxis, speedAxis);

                // pwm value
                lineChart.setLineColor(config.leftPwmColor()).setPointColor(config.leftPwmColor());
                lineChart.plotLine(PwmIterator(leftTelemetry), timeAxis, pwmAxis);
                lineChart.setLineColor(config.rightPwmColor()).setPointColor(config.rightPwmColor());
                lineChart.plotLine(PwmIterator(rightTelemetry), timeAxis, pwmAxis);

                // done
                lineChart.detachContext();
            }
            
            speedAxis.drawLeftText(`${speedAxis.minimum().toFixed(1)}`, speedAxis.minimum());
            speedAxis.drawLeftText(`${speedAxis.maximum().toFixed(1)}`, speedAxis.maximum());
            pwmAxis.drawRightText(`${pwmAxis.minimum()}`, pwmAxis.minimum());
            pwmAxis.drawRightText(`${pwmAxis.maximum()}`, pwmAxis.maximum());
            timeAxis.drawBottomText("0", timeAxis.minimum());
            timeAxis.drawBottomText(`${config.telemetryPlotMs() / 1000}`, timeAxis.maximum());

            // draw average speed along bottom axis
            const leftAverageSpeed = averageSpeed(leftTelemetry, config.averageSpeedMs()).toFixed(1);
            const rightAverageSpeed = averageSpeed(rightTelemetry, config.averageSpeedMs()).toFixed(1); 
            timeAxis.drawBottomText(
                `left = ${leftAverageSpeed}, right = ${rightAverageSpeed}`, 
                timeAxis.minimum() + (0.5 * (timeAxis.maximum() - timeAxis.minimum())));

            // done and done
            pwmAxis.detachContext();
            speedAxis.detachContext();
            timeAxis.detachContext();
    
        }
        return self;
    }

    /** @type {CanvasPainterType} */
    const self = Object.freeze({
        "isCanvasAttached": isCanvasAttached,
        "attachCanvas": attachCanvas,
        "detachCanvas": detachCanvas,
        "paint": paint,
    });

    return self;
}

/// <reference path="../utilities/message_bus.js" />

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
     * This specifieS a field in the message that 
     * contains the telemetry data we desire.
     * 
     * @returns {string}
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
     * @returns {TelemetryListenerType}  // RET: self for fluent chained api calls
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
/// <reference path="../utilities/message_bus.js" />

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

/// <reference path="../utilities/dom_utilities.js" />
/// <reference path="telemetry_listener.js" />
/// <reference path="../command/rover_command.js" />

/**
 * View controller for the reset telemetry button.
 * 
 * @typedef {object} ResetTelemetryViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => ResetTelemetryViewControllerType} attachView
 * @property {() => ResetTelemetryViewControllerType} detachView
 * @property {() => boolean} isListening
 * @property {() => ResetTelemetryViewControllerType} startListening
 * @property {() => ResetTelemetryViewControllerType} stopListening
 * @property {() => boolean} isViewShowing
 * @property {() => ResetTelemetryViewControllerType} showView
 * @property {() => ResetTelemetryViewControllerType} hideView
 */

/**
 * View controller for the reset telemetry button.
 * 
 * @param {(() => void) | undefined} resetFunction      // IN : function to call when 
 *                                                              reset button is clicked
 * @param {TelemetryListenerType[]} telemetryListeners  // IN : list of listeners to reset.
 * @param {string} cssContainer                         // IN : selector for button container
 * @param {string} cssButton                            // IN : selector applied to container
 *                                                              to get the reset button.
 * @returns {ResetTelemetryViewControllerType}
 */
function ResetTelemetryViewController(
    resetFunction,
    telemetryListeners,
    cssContainer,
    cssButton)
{
    /** @type {HTMLElement} */
    let _container = undefined;

    /** @type {HTMLButtonElement} */
    let _button = undefined;

    /**
     * @summary Determine if controller is bound to DOM.
     * 
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    function isViewAttached()
    {
        return !!_container;
    }

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);
        if(!_container) throw Error(`${cssContainer} not found`);

        _button = _container.querySelector(cssButton);

        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * 
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if (isViewAttached()) {
            _container = undefined;
            _button = undefined;
        }
        return self;
    }

    let _listening = 0;

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for DOM events.
     * @description
     * This adds event listeners to attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            if(isViewAttached()) {
                _button.addEventListener("click", _onClick);
            }
        }

        return self;
    }

    /**
     * @summary Stop listening for DOM events.
     * @description
     * This removes event listeners from attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {

            if(isViewAttached()) {
                _button.removeEventListener("click", _onClick);
            }
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    /**
     * @summary Determine if the view is showing.
     * 
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    function isViewShowing() {
        return _showing > 0;
    }

    /**
     * @summary Show/Enable the view.
     * 
     * @description
     * Show the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function showView() {
        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    /**
     * @summary Hide/Disable the view.
     * 
     * @description
     * Hide the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {ResetTelemetryViewControllerType} this controller instance for fluent chain calling
     */
    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * @summary Event hanlder for click on reset button.
     * 
     * @description
     * 
     * 
     * @param {Event} event 
     */
    function _onClick(event) {
        // send reset command to rover
        if(typeof resetFunction === "function") {
            resetFunction();
        }
        // reset telemetry
        if(Array.isArray(telemetryListeners)) {
            telemetryListeners.forEach(telemetryListener => {
                telemetryListener.reset();
            });
        };
    }

    /** @type {ResetTelemetryViewControllerType} */
    const self = {
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
    }

    return self;
}

/// <reference path="../utilities/message_bus.js" />
/// <reference path="../view/widget/canvas/canvas_view_controller.js" />
/// <reference path="../control/turtle/turtle_view_controller.js" />
/// <reference path="../control/turtle/turtle_keyboard_controller.js" />
/// <reference path="../control/joystick/gamepad_view_controller.js" />
/// <reference path="reset_telemetry_view_controller.js" />


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
///////////////// Gamepad Utilities ////////////////
/**
 * @typedef {object} GamepadMapperType
 * @property {(gamepads: Gamepad[]) => Gamepad[]} connectedGamePads
 * @property {(buttonValue: number, start: number, end: number) => number} mapButtonRange
 * @property {(axisValue: number, start: number, end: number) => number} mapAxisRange
 * @property {(gamepads: any, gamePadIndex: number, axesOfInterest: number[], buttonsOfInterest: number[]) => {axes: number[], buttons: number[]}} mapGamePadValues
 */

/**
 * Construct a game pad mapper instance.
 * 
 * @returns {GamepadMapperType}
 */
function GamepadMapper() {

    /**
     * filter list of gamepads and return
     * only connected gamepads.
     * 
     * @param {Gamepad[]} gamepads  // IN : list of Gamepad from navigator.getGamepads()
     * @returns {Gamepad[]}         // RET: list of connected Gamepads
     */
    function connectedGamePads(gamepads) {
        /** @type {Gamepad[]} */
        const connected = []
        if (gamepads && gamepads.length) {
            for (let i = 0; i < gamepads.length; i += 1) {
                const gamepad = gamepads[i];
                if (gamepad && gamepad.connected) {
                    connected.push(gamepad);
                }
            }
        }
        return connected;
    }


    /**
     * Map a button value of 0.0 to 1.0 to given range.
     * 
     * @param {number} buttonValue, between 0.0 and 1.0
     * @param {number} start, range start inclusive (start may be >= end)
     * @param {number} end, range end includes (end may be <= start)
     * @returns {number} in range of start to end inclusive
     */
    function mapButtonRange(buttonValue, start, end) {
        if (typeof buttonValue !== "number") throw new TypeError();
        if (typeof start !== "number") throw new TypeError();
        if (typeof end !== "number") throw new TypeError();

        //
        // map button's value of 0.0 to 1.0
        // to range start to end
        //
        return buttonValue * (end - start) + start;
    }


    /**
     * Map an axis value of -1.0 to 1.0 to given range.
     * 
     * @param {number} axisValue, between -1.0 and 1.0
     * @param {number} start, range start inclusive (start may be >= end)
     * @param {number} end, range end includes (end may be <= start)
     * @returns {number} in range of start to end inclusive
     */
    function mapAxisRange(axisValue, start, end) {
        if (typeof axisValue !== "number") throw new TypeError();
        if (typeof start !== "number") throw new TypeError();
        if (typeof end !== "number") throw new TypeError();

        //
        // map axis' value of -1.0 to 1.0
        // to range start to end
        //
        return ((axisValue + 1) / 2) * (end - start) + start;
    }


    /**
     * Get values of buttons and axes of interest for the requested gamepad.
     * The order of returned values is the same as the order of the indices
     * in the array arguments; so the caller can create a mapping by
     * deciding which values and in what order they should be returned.
     * 
     * @param {number} gamePadIndex        : index of gamePad in array of gamePads returned by navigator.getGamepads()
     * @param {number[]} axesOfInterest    : list of indices of the axis to read (returned in this order)
     * @param {number[]} buttonsOfInterest : list of indices of the buttons to read (returned in this order)
     * @return {{axes: number[], buttons: number[]}} value axes and buttons requested in specified 
     *                                               in axesOfInterest and buttonsOfInterest;
     *                                               value is 0.0 to 1.0 for buttons,
     *                                               value is -1.0 to 1.0 for axes 
     */
    function mapGamePadValues(gamepads, gamePadIndex, axesOfInterest, buttonsOfInterest) {
        let state = {
            /** @type {number[]} */
            axes: [],

            /** @type {number[]} */
            buttons: []
        };

        if (gamepads && (gamepads.length > 0)) {
            const gamepad = gamepads[gamePadIndex];
            if (gamepad) {
                for (let i = 0; i < axesOfInterest.length; i += 1) {
                    const axesIndex = axesOfInterest[i];
                    state.axes.push(gamepad.axes[axesIndex]);
                }
                for (let i = 0; i < buttonsOfInterest.length; i += 1) {
                    const buttonIndex = buttonsOfInterest[i];
                    state.buttons.push(gamepad.buttons[buttonIndex]);
                }
            }
        }

        return state;
    }

    /** @type {GamepadMapperType} */
    const self = {
        "mapGamePadValues": mapGamePadValues,
        "mapAxisRange": mapAxisRange,
        "mapButtonRange": mapButtonRange,
        "connectedGamePads": connectedGamePads,
    }

    return self;
}
/// <reference path="../../utilities/dom_utilities.js" />
/// <reference path="../../utilities/message_bus.js" />
/// <reference path="gamepad.js" />
/// <reference path="../../utilities/rollback_state.js" />
/// <reference path="../../view/view_state_tools.js" />
/// <reference path="../../view/view_widget_tools.js" />
/// <reference path="../../view/widget/range/range_widget_controller.js" />

/////////////////// Gamepad View Controller ////////////////////
/**
 * @typedef {object} GamePadViewControllerType
 * @property {() => number} getGamePadIndex
 * @property {() => number} getAxisOne 
 * @property {() => number} getAxisOneValue
 * @property {() => boolean} getAxisOneFlip
 * @property {() => number} getAxisOneZero
 * @property {() => number} getAxisTwo 
 * @property {() => number} getAxisTwoValue
 * @property {() => boolean} getAxisTwoFlip
 * @property {() => number} getAxisTwoZero
 * @property {() => GamePadViewControllerType} attachView
 * @property {() => GamePadViewControllerType} detachView
 * @property {() => boolean} isViewAttached
 * @property {() => GamePadViewControllerType} startListening
 * @property {() => GamePadViewControllerType} stopListening
 * @property {() => boolean} isListening
 * @property {() => GamePadViewControllerType} showView
 * @property {() => GamePadViewControllerType} hideView
 * @property {() => boolean} isViewShowing
 * @property {(force?: boolean) => GamePadViewControllerType} updateView
 * @property {(message: string, data: any, specifier?: string) => void} onMessage
 */

/**
 * Construct a GamePadViewController.
 * 
 * @param {HTMLElement} container, parent element
 * @param {string} cssSelectGamePad, css selector for gamepad select menu element
 * @param {string} cssSelectAxisOne, css selector for throttle axis select menu element
 * @param {string} cssSelectAxisTwo, css selector for steering axis select menu element
 * @param {string} cssAxisOneValue, css selector for throttle axis value text element
 * @param {string} cssAxisTwoValue, css selector for steering axis value test element
 * @param {string} cssAxisOneZero, css selector for axis zero value range element
 * @param {string} cssAxisTwoZero, css selector for axis zero value range element
 * @param {string} cssAxisOneFlip, css selector for axis flip (invert) checkbox element
 * @param {string} cssAxisTwoFlip, css selector for axis flip (invert) checkbox element
 * @param {MessageBusType} messageBus       //  IN: MessageBus
 */
function GamePadViewController(
    container,
    cssSelectGamePad,
    cssSelectAxisOne,
    cssSelectAxisTwo,
    cssAxisOneValue,
    cssAxisTwoValue,
    cssAxisOneZero,
    cssAxisTwoZero,
    cssAxisOneFlip,
    cssAxisTwoFlip,
    messageBus) 
{
    let _connectedGamePads = [];
    let _requestAnimationFrameNumber = 0;


    //
    // gamepad utilities
    //
    const gamepad = GamepadMapper();

    //
    // view state
    //
    const _gamePadState = RollbackState({
        // 
        // gamepad menu state
        //

        /** @type {string[]} */
        gamePadNames: [],   // [string]: array of connected controller names 
                            //           or empty array if no controller is connected

        /** @type {number[]} */
        gamePadIndices: [], // [integer]: array of integer where each integer is an index into navigator.getGamePads()
                            //            or empty array if no gamepad is connected.
        
        /** @type {number[]} */
        gamePadAxes: [],    // [integer]: array integer with axis count for each gamepad
        selected: -1,       // integer: index of selected gamepad into gamePadNames, gamePadIndices and gamePadAxes

        //
        // menu state
        //
        axisCount: 0,       // integer: number of axes on selected gamepad
        axisOne: 0,         // integer: index of axis for controlling throttle
        axisOneValue: 0.0,  // float: value -1.0 to 1.0 for throttle axis
        axisOneFlip: false, // boolean: true to invert axis value, false to use natural axis value
        axisOneZero: 0.15,   // float: value 0.0 to 1.0 for zero area of axis
        axisOneZeroLive: 0.15,   // float: value 0.0 to 1.0 for zero area of axis live update
        axisTwo: 0,         // integer: index of axis for controlling steering
        axisTwoValue: 0.0,  // float: value -1.0 to 1.0 for steering axis
        axisTwoFlip: false, // boolean: true to invert axis value, false to use natural axis value
        axisTwoZero: 0.15,   // float: value 0.0 to 1.0 for zero area of axis
        axisTwoZeroLive: 0.15,   // float: value 0.0 to 1.0 for zero area of axis live udpated
    });


    const _axisOneZero = RangeWidgetController(
        _gamePadState, "axisOneZero", "axisOneZeroLive", 
        1.0, 0.0, 0.01, 2, 
        cssAxisOneZero);

    const _axisTwoZero = RangeWidgetController(
        _gamePadState, "axisTwoZero", "axisTwoZeroLive", 
        1.0, 0.0, 0.01, 2, 
        cssAxisTwoZero);

    /**
     * Get the gamepad index of the selected gamepad.
     * 
     * @returns {number} // RET: index of selected gamepad
     *                           or -1 if no gamepad is selected. 
     */
    function getGamePadIndex() {
        const selected = _gamePadState.getValue("selected");
        return (selected >= 0) ?
            _gamePadState.getValue("gamePadIndices")[selected] :
            -1;
    }

    /**
     * Get the gamepad index of the first joystick axis.
     * This is the value for either throttle or for the 
     * left motor, depending on the drive mode.
     * 
     * @returns {number} // RET: -1.0 to 1.0
     */
    function getAxisOne() {
        return _gamePadState.getValue("axisOne");
    }

    /**
     * Get the current value of the first joystick axis.
     * This is the value for either throttle or for the 
     * left motor, depending on the drive mode.
     * 
     * @returns {number} // RET: -1.0 to 1.0
     */
    function getAxisOneValue() {
        return _gamePadState.getValue("axisOneValue");
    }

    /**
     * Determine if the first joystick axis value
     * should be flipped such that range of 
     * -1.0 to 1.0 is flipped to 1.0 to -1.0
     * 
     * @returns {boolean} // RET: true to invert axis value, false to use natural axis value
     */
    function getAxisOneFlip() {
        return _gamePadState.getValue("axisOneFlip");
    }

    /**
     * Get the value around zero that will be considered zero.
     * So if axis zero value is 0.15, then axis values
     * between -0.15 and 0.15 will be treated as zero.
     * This is to handle very noisy joysticks.
     * 
     * @returns {number}
     */
    function getAxisOneZero() {
        return _gamePadState.getValue("axisOneZero");
    }

    /**
     * Get the index of the second joystick axis.
     * This is the axis that controls steering or
     * the right motor, depending on the drive mode.
     * 
     * @returns {number}
     */
    function getAxisTwo() {
        return _gamePadState.getValue("axisTwo");
    }

    /**
     * Get the current value of the second joystick axis.
     * This is the value for either steering or for the 
     * right motor, depending on the drive mode.
     * 
     * @returns {number} // RET: -1.0 to 1.0
     */
    function getAxisTwoValue() {
        return _gamePadState.getValue("axisTwoValue");
    }

    /**
     * Determine if the second joystick axis value
     * should be flipped such that range of 
     * -1.0 to 1.0 is flipped to 1.0 to -1.0
     * 
     * @returns {boolean} // RET: true to invert axis value, false to use natural axis value
     */
    function getAxisTwoFlip() {
        return _gamePadState.getValue("axisTwoFlip");
    }

    /**
     * Get the value around zero that will be considered zero.
     * So if axis zero value is 0.15, then axis values
     * between -0.15 and 0.15 will be treated as zero.
     * This is to handle very noisy joysticks.
     * 
     * @returns {number}
     */
    function getAxisTwoZero() {
        return _gamePadState.getValue("axisTwoZero");
    }

    let gamePadSelect = undefined;
    let axisOneSelect = undefined;
    let axisTwoSelect = undefined;
    let axisOneText = undefined;
    let axisTwoText = undefined;
    let axisOneFlip = undefined;
    let axisTwoFlip = undefined;

    /**
     * Bind to the dom using the css values provided to the constructor.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function attachView() {
        if (!isViewAttached()) {
            gamePadSelect = container.querySelector(cssSelectGamePad);

            axisOneSelect = container.querySelector(cssSelectAxisOne);
            axisTwoSelect = container.querySelector(cssSelectAxisTwo);
            axisOneText = container.querySelector(cssAxisOneValue);
            axisTwoText = container.querySelector(cssAxisTwoValue);

            axisOneFlip = container.querySelector(cssAxisOneFlip);
            axisTwoFlip = container.querySelector(cssAxisTwoFlip);

            _axisOneZero.attachView();
            _axisTwoZero.attachView();
        }
        return self;
    }

    /**
     * Unbind from the dom.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function detachView() {
        if (isListening()) throw new Error("Attempt to detachView while still listening");
        if (isViewAttached()) {
            gamePadSelect = undefined;

            axisOneSelect = undefined;
            axisTwoSelect = undefined;
            axisOneText = undefined;
            axisTwoText = undefined;

            axisOneFlip = undefined;
            axisTwoFlip = undefined;

            _axisOneZero.detachView()
            _axisTwoZero.detachView();
        }
        return self;
    }

    /**
     * Determine if controller is bound to the dom.
     * 
     * @returns {boolean}
     */
    function isViewAttached() {
        return !!gamePadSelect;
    }

    //
    // attach listeners for connection events
    //
    let _listening = 0;

    /**
     * Start listening for dom events.
     * Each call to startListening() must be matched
     * to a call to stopListening() for listeners to be released.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function startListening() {
        _listening += 1;
        if (1 === _listening) {
            // listen for changes to list of gamepads
            if (messageBus) {
                // use message bus to get event from singleton listener
                messageBus.subscribe("gamepadconnected", self);
                messageBus.subscribe("gamepaddisconnected", self);
            } else {
                // listen for the event ourselves
                window.addEventListener("gamepadconnected", _onGamepadConnectedEvent);
                window.addEventListener("gamepaddisconnected", _onGamepadDisconnectedEvent);
            }

            if (gamePadSelect) {
                gamePadSelect.addEventListener("change", _onGamePadChanged);
            }
            if (axisOneSelect) {
                axisOneSelect.addEventListener("change", _onAxisOneChanged);
            }
            if (axisTwoSelect) {
                axisTwoSelect.addEventListener("change", _onAxisTwoChanged);
            }

            if (axisOneFlip) {
                axisOneFlip.addEventListener("change", _onAxisOneFlipChanged);
            }
            if (axisTwoFlip) {
                axisTwoFlip.addEventListener("change", _onAxisTwoFlipChanged);
            }

            _axisOneZero.startListening();
            _axisTwoZero.startListening();
        }

        // start updating
        if(_listening) {
            _gameloop(performance.now());
        }

        return self;
    }

    /**
     * Stop listening for dom events.
     * Each call to startListening() must be matched
     * to a call to stopListening() for listeners to be released.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            if (messageBus) {
                messageBus.unsubscribeAll(self);
            } else {
                window.removeEventListener("gamepadconnected", _onGamepadConnectedEvent);
                window.removeEventListener("gamepaddisconnected", _onGamepadDisconnectedEvent);
            }

            if (gamePadSelect) {
                gamePadSelect.removeEventListener("change", _onGamePadChanged);
            }
            if (axisOneSelect) {
                axisOneSelect.removeEventListener("change", _onAxisOneChanged);
            }
            if (axisTwoSelect) {
                axisTwoSelect.removeEventListener("change", _onAxisTwoChanged);
            }

            if (axisOneFlip) {
                axisOneFlip.removeEventListener("change", _onAxisOneFlipChanged);
            }
            if (axisTwoFlip) {
                axisTwoFlip.removeEventListener("change", _onAxisTwoFlipChanged);
            }

            _axisOneZero.stopListening();
            _axisTwoZero.stopListening();

            // stop updating
            window.cancelAnimationFrame(_requestAnimationFrameNumber);
        }
        return self;
    }

    /**
     * Determining if actively listening for dom events and messages.
     * 
     * @returns {boolean}
     */
    function isListening() {
        return _listening > 0;
    }

    let showing = 0;

    /**
     * Show the view.
     * Each call to showView() must be balanced with 
     * a call to hideView() for the view to be hidden.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function showView() {
        showing += 1;
        if (1 === showing) {
            show(container);
        }
        return self;
    }

    /**
     * Attempt to hide the view.
     * Each call to showView() must be balanced with 
     * a call to hideView() for the view to be hidden.
     * 
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function hideView() {
        showing -= 1;
        if (0 === showing) {
            hide(container);
        }
        return self;
    }

    /**
     * Determine if the view is visible.
     * 
     * @returns {boolean}
     */
    function isViewShowing() {
        return showing > 0;
    }

    /**
     * Update values from view and if any values changed
     * then force a redraw of the view.
     * 
     * @param {boolean} force // IN : true to force redraw regardless of changed values
     * @returns {GamePadViewControllerType}  // RET: this controller for fluent chain calling.
     */
    function updateView(force = false) {
        _updateGamePadValues();
        _enforceGamePadView(force);
        return self;
    }

    /**
     * Called regularly to update values and redraw the view if necessary.
     * 
     * @private
     * @param {number} timeStamp // IN : time of current update
     */
    function _gameloop(timeStamp) {
        updateView();

        if (_listening) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_gameloop);
        }
    }

    /**
     * Update the gamepad values base on the view.
     * 
     * @private
     */
    function _updateGamePadValues() {
        _connectedGamePads = gamepad.connectedGamePads(navigator.getGamepads());

        const values = gamepad.mapGamePadValues(
            _connectedGamePads,
            getGamePadIndex(), [getAxisOne(), getAxisTwo()], []);

        _gamePadState.setValue("axisOneValue", values.axes.length >= 1 ? values.axes[0] : 0);
        _gamePadState.setValue("axisTwoValue", values.axes.length >= 2 ? values.axes[1] : 0);

        _axisTwoZero.updateViewState();
        _axisOneZero.updateViewState();
    }

    /**
     * Redraw the view if any backing values have changed.
     * Make the view match the state.
     * 
     * @private
     * @param {boolean} force // IN : true to force redraw regardless of changed values.
     */
    function _enforceGamePadView(force = false) {
        //
        // if we have a staged value, then
        // we need to update that ui element
        //
        _enforceGamePadMenu(gamePadSelect, force);
        _enforceGamePadSelection(gamePadSelect, force);

        //
        // if available axes have changed, then recreate options menus
        //
        const enforced = _enforceAxisOptions(axisOneSelect, "axisOne", force);
        ViewStateTools.enforceSelectMenu(_gamePadState, "axisOne", axisOneSelect, force);
        ViewStateTools.enforceText(_gamePadState, "axisOneValue", axisOneText, force);
        ViewStateTools.enforceCheck(_gamePadState, "axisOneFlip", axisOneFlip, force);
        _axisOneZero.enforceView(force);

        _enforceAxisOptions(axisTwoSelect, "axisTwo", enforced || force);
        ViewStateTools.enforceSelectMenu(_gamePadState, "axisTwo", axisTwoSelect, force);
        ViewStateTools.enforceText(_gamePadState, "axisTwoValue", axisTwoText, force);
        ViewStateTools.enforceCheck(_gamePadState, "axisTwoFlip", axisTwoFlip, force);
        _axisTwoZero.enforceView(force);
    }


    /**
     * Redraw the gamepad menu view if any backing values have changed.
     * Make the view match the state.
     * 
     * @private
     * @param {HTMLSelectElement} selectElement // IN : the menu view
     * @param {boolean} force // IN : true to force a redraw despite changed values.
     * @returns // RET: true if view was updated, false if not
     */
    function _enforceGamePadMenu(selectElement, force = false) {
        //
        // if we have a staged value, then
        // we need to update that ui element
        //
        if (force || _gamePadState.isStaged("gamePadNames")) {

            if (selectElement) {
                //
                // clear menu option and rebuild from state
                //
                _clearOptions(selectElement);
                const names = _gamePadState.commitValue("gamePadNames");
                const indices = _gamePadState.commitValue("gamePadIndices");
                _assert(names.length === indices.length);

                if (names.length > 0) {
                    for (let i = 0; i < names.length; i += 1) {
                        const option = document.createElement("option");
                        option.text = names[i];
                        option.value = indices[i];
                        selectElement.appendChild(option);
                    }
                    selectElement.classList.remove("disabled");
                } else {
                    selectElement.classList.add("disabled");

                }
                return true;
            }
        }

        return false;
    }

    /**
     * Redraw the gamepad selection if any backing values have changed.
     * Make the view match the state.
     * 
     * @private
     * @param {HTMLSelectElement} selectElement // IN : menu view
     * @param {boolean} force // IN : true to force a redraw regardless of changed values.
     * @returns // RET: true if view was redrawn, false if not.
     */
    function _enforceGamePadSelection(selectElement, force = false) {
        //
        // if we have a staged value, then
        // we need to update that ui element
        //
        if (force || _gamePadState.isStaged("selected")) {
            if (selectElement) {
                const selected = _gamePadState.commitValue("selected");
                selectElement.value = selected;

                // update axis count for selected controller
                _gamePadState.setValue("axisCount",
                    (selected >= 0) ?
                    _gamePadState.getValue("gamePadAxes")[selected] :
                    0);
                return true;
            }
        }

        return false;
    }


    /**
     * Enforce the axis menu's list of options if they have changed;
     * make the view match the state.
     * 
     * @private
     * @param {HTMLSelectElement} selectElement // IN : menu view
     * @param {string} selectorValue // IN : menu css selector
     * @param {boolean} force // RET: true to force a redraw regardless of changed values.
     * @returns {boolean} // RET: true if redrawn, false if not
     */
    function _enforceAxisOptions(selectElement, selectorValue, force = false) {
        //
        // enforce the select's option list
        //
        if (force || _gamePadState.isStaged("axisCount")) {
            if (selectElement) {
                //
                // clear menu options and rebuild from state
                //
                _clearOptions(selectElement);
                const axisCount = _gamePadState.commitValue("axisCount");
                if (axisCount > 0) {
                    for (let i = 0; i < axisCount; i += 1) {
                        const option = document.createElement("option");
                        option.text = `axis ${i}`;
                        option.value = i.toString();
                        selectElement.appendChild(option);
                    }
                    selectElement.classList.remove("disabled");
                } else {
                    selectElement.classList.add("disabled");
                }
                selectElement.value = _gamePadState.commitValue(selectorValue);

                return true;
            }
        }
        return false;
    }


    /**
     * Update the connected gamepads state.
     * 
     * @private
     */
    function _updateConnectedGamePads() {
        _connectedGamePads = gamepad.connectedGamePads(navigator.getGamepads());

        //
        // update the gamepad state with newly connected gamepad
        //
        const gamePads = _connectedGamePads;
        const names = gamePads.map(g => g.id);
        const indices = gamePads.map(g => g.index);
        const axes = gamePads.map(g => g.axes.length);

        _gamePadState.setValue("gamePadNames", names);
        _gamePadState.setValue("gamePadIndices", indices);
        _gamePadState.setValue("gamePadAxes", axes);

        //
        // handle case where gamepads are available, but
        // we don't have one selected; select the first one.
        //
        if(names.length > 0) {
            //
            // there is a gamepad available, but none is selected
            // or selection is out of range, then select the first one.
            //
            const selected = _gamePadState.getValue("selected");
            const hasSelected = ("number" === typeof selected) && (selected >= 0) && (indices.indexOf(selected) >= 0);
            if(!hasSelected) {
                _gamePadState.setValue("selected", gamePads[0].index);
                _gamePadState.setValue("axisCount", axes[0]);
                _gamePadState.setValue("axisOne", 0);
                _gamePadState.setValue("axisOneValue", 0.0);
                _gamePadState.setValue("axisTwo", 0);
                _gamePadState.setValue("axisTwoValue", 0.0);
            }
        } else {
            _gamePadState.setValue("selected", -1);
            _gamePadState.setValue("axisCount", 0);
            _gamePadState.setValue("axisOne", 0);
            _gamePadState.setValue("axisOneValue", 0.0);
            _gamePadState.setValue("axisTwo", 0);
            _gamePadState.setValue("axisTwoValue", 0.0);
        }
    }


    /**
     * When a gamepad is connected, update the connect gamepad state.
     * 
     * @private
     * @param {Gamepad} gamepad 
     */
    function _onGamepadConnected(gamepad) {
        // update state with new list of gamepads
        _updateConnectedGamePads();
        _gamePadState.setValue("selected", gamepad.index);
        _gamePadState.setValue("axisCount", gamepad.axes.length);
    }

    /**
     * Shim that gets event when a gamepad is connnected.
     * 
     * @private
     * @param {GamepadEvent} event 
     */
    function _onGamepadConnectedEvent(event) {
        _onGamepadConnected(event.gamepad);
    }

    /**
     * Called when a gamepad is disconnected.
     * Update the list of connected gamepads and
     * if the selected gamepad is the one being
     * disconnected, then reset the selection.
     * 
     * @param {Gamepad} gamepad 
     */
    function _onGamepadDisconnected(gamepad) {
        //
        // if the currently selected gamepad is disconnected,
        // then reset the selected value.
        //
        _gamePadState.setValue("selected", -1);
        _gamePadState.setValue("axisCount", 0);
        _updateConnectedGamePads();
    }

    /**
     * Shim that gets event when a gamepad is disconnected.
     * 
     * @param {GamepadEvent} event 
     */
    function _onGamepadDisconnectedEvent(event) {
        _onGamepadDisconnected(event.gamepad);
    }

    /**
     * Event Handler called when selected gamepad is changed in UI.
     * 
     * @param {Event & {target: HTMLSelectElement}} event 
     */
    function _onGamePadChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        if (event.target) {
            console.log(`_onGamePadChanged(${event.target.value})`);
            _gamePadState.setValue("selected", parseInt(event.target.value));
            _updateConnectedGamePads();
        }
    }

    /**
     * Event handler called when axis one selection changes.
     * 
     * @param {Event & {target: HTMLSelectElement}} event 
     */
    function _onAxisOneChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisOne", parseInt(event.target.value));
    }

    /**
     * Event handler called when axis two selection changes.
     * 
     * @param {Event & {target: HTMLSelectElement}} event 
     */
    function _onAxisTwoChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisTwo", parseInt(event.target.value));
    }

    /**
     * Event handler called when axis one flip checkbox is changed.
     * 
     * @param {Event & {target: HTMLInputElement}} event 
     */
    function _onAxisOneFlipChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisOneFlip", event.target.checked);
    }

    /**
     * Event handler called when axis two flip checkbox is changed.
     * 
     * @param {Event & {target: HTMLInputElement}} event 
     */
    function _onAxisTwoFlipChanged(event) {
        //
        // update state with new value;
        // that will cause a redraw
        //
        _gamePadState.setValue("axisTwoFlip", event.target.checked);
    }

    /**
     * Clear all the select menu options.
     * 
     * @param {HTMLSelectElement} select 
     */
    function _clearOptions(select) {
        ViewWidgetTools.clearSelectOptions(select);
    }

    /**
     * Assert a value and throw error if it evaluates to false.
     * 
     * @param {boolean} test 
     * @throws {Error} if test is false
     */
    function _assert(test) {
        if (!test) {
            throw new Error();
        }
    }

    /**
     * Message handler.
     * 
     * @param {string} message 
     * @param {any} data 
     * @param {string | undefined} specifier
     */
    function onMessage(message, data, specifier=undefined) {
        switch (message) {
            case "gamepadconnected":
                {
                    _onGamepadConnected(data);
                    return;
                }
            case "gamepaddisconnected":
                {
                    _onGamepadDisconnected(data);
                    return;
                }
            default:
                {
                    console.log("Unhandled message in GamePadViewController");
                }
        }
    }

    //
    // public methods
    //
    /** @type {GamePadViewControllerType} */
    const self = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "attachView": attachView,
        "detachView": detachView,
        "isViewAttached": isViewAttached,
        "showView": showView,
        "hideView": hideView,
        "isViewShowing": isViewShowing,
        "updateView": updateView,
        "getGamePadIndex": getGamePadIndex,
        "getAxisOne": getAxisOne,
        "getAxisOneValue": getAxisOneValue,
        "getAxisOneFlip": getAxisOneFlip,
        "getAxisOneZero": getAxisOneZero,
        "getAxisTwo": getAxisTwo,
        "getAxisTwoValue": getAxisTwoValue,
        "getAxisTwoFlip": getAxisTwoFlip,
        "getAxisTwoZero": getAxisTwoZero,
        "onMessage": onMessage,
    }

    return self;
}
/// <reference path="../../telemetry/telemetry_model_listener.js" />

/** @typedef {"NOT_RUNNING"|"STARTING"|"RUNNING"|"ACHIEVED"} GotoGoalStateType */
/**
 * @typedef {object} GotoGoalModelObject
 * @property {GotoGoalStateType} state
 * @property {number} x  // x position
 * @property {number} y  // y position
 * @property {number} pointForward // point forward as fraction of wheelbase
 * @property {number} tolerance    // goal achieved when distance to goal <= tolerance
 */

/**
 * @implements {TelemetryModelType}
 * @typedef {object} GotoGoalModelType
 * @property {(key: string) => any} get
 * @property {(key: string, value: any) => void} set
 * @property {() => void} reset
 * @property {() => GotoGoalStateType} state
 * @property {(state: GotoGoalStateType) => GotoGoalModelType} setState
 * @property {() => number} x
 * @property {(x: number) => GotoGoalModelType} setX
 * @property {() => number} y
 * @property {(y: number) => GotoGoalModelType} setY
 * @property {() => number} tolerance
 * @property {(tolerance: number) => GotoGoalModelType} setTolerance
 * @property {() => number} pointForward
 * @property {(pointForward: number) => GotoGoalModelType} setPointForward
 * @property {() => GotoGoalModelObject} toObject
 */
/**
 * Singleton goto goal behavior state.
 * @returns {GotoGoalModelType}
 */
const GotoGoalModel = (function() {
    const NOT_RUNNING = "NOT_RUNNING";
    const STARTING = "STARTING";
    const RUNNING = "RUNNING";
    const ACHIEVED = "ACHIEVED";

    /** @type {GotoGoalModelObject} */
    const _defaultModel =  {
        state: NOT_RUNNING, // state
        x: 0,               // x position 
        y: 0,               // y position
        pointForward: 0.75, // point forward as fraction of wheelbase
        tolerance: 0,       // goal achieved when distance to goal <= tolerance
    };

    let _model = {..._defaultModel};

    /**
     * Get a value by key.
     * 
     * @param {string} key 
     * @returns {any}
     */
    function get(key) {
        if(_defaultModel.hasOwnProperty(key)) {
            return _model[key];
        }
        return undefined;
    }

    /**
     * Set a value by key.
     * 
     * @param {string} key 
     * @param {any} value 
     */
    function set(key, value) {
        if(_defaultModel.hasOwnProperty(key)) {
            _model[key] = value;
        }
    }

    /**
     * Reset the model to defaults.
     */
    function reset() {
        _model = {..._defaultModel};
    }

    /**
     * Get the goto goal current state.
     * 
     * @returns {GotoGoalStateType}
     */
    function state() {
        return _model.state;
    }

    /**
     * Set the model state.
     * 
     * @param {GotoGoalStateType} state 
     * @returns {GotoGoalModelType}
     */
    function setState(state) {
        _model.state = state;
        return self;
    }

    /**
     * Get goto goal x position.
     * 
     * @returns {number}
     */
    function x() {
        return _model.x;
    }

    /**
     * Set goto goal x position.
     * 
     * @param {number} x 
     * @returns {GotoGoalModelType} // RET: this GotoGoalModel for fluent chain calling.
     */
    function setX(x) {
        _model.x = x;
        return self;
    }

    /**
     * Get goto goal y position.
     * 
     * @returns {number}
     */
    function y() {
        return _model.y;
    }

    /**
     * Set goto goal y position.
     * 
     * @param {number} y 
     * @returns {GotoGoalModelType} // RET: this GotoGoalModel for fluent chain calling.
     */
    function setY(y) {
        _model.y = y;
        return self;
    }

    /**
     * Get the Goto Goal tolerance.
     * This is the distance to the goal that 
     * indicates that goal is achieved.
     * 
     * @returns {number}
     */
    function tolerance() {
        return _model.tolerance;
    }

    /**
     * Set the Goto Goal tolerance.
     * This is the distance to the goal that 
     * indicates that goal is achieved.
     * 
     * @param {number} tolerance 
     * @returns {GotoGoalModelType} // RET: this GotoGoalModel for fluent chain calling.
     */
    function setTolerance(tolerance) {
        _model.tolerance = tolerance;
        return self;
    }

    /**
     * Get the point forward as fraction of the wheelbase.
     * 
     * @returns {number}
     */
    function pointForward() {
        return _model.pointForward;
    }

    /**
     * Set the point forward as fraction of the wheelbase.
     * 
     * @param {number} pointForward 
     * @returns {GotoGoalModelType} // RET: this GotoGoalModel for fluent chain calling.
     */
    function setPointForward(pointForward) {
        _model.pointForward = pointForward;
        return self;
    }

    /**
     * Convert Goto Goal model to object.
     * 
     * @returns {GotoGoalModelObject}
     */
    function toObject() {
        return {
            "state": state(),
            "x": x(),
            "y": y(),
            "pointForward": pointForward(),
            "tolerance": tolerance(),
        };
    }

    /** @typedef {GotoGoalModelType} */
    const self = {
        "get": get,
        "set": set,
        "reset": reset,
        "state": state,
        "setState": setState,
        "x": x,
        "setX": setX,
        "y": y,
        "setY": setY,
        "pointForward": pointForward,
        "setPointForward": setPointForward,
        "tolerance": tolerance,
        "setTolerance": setTolerance,
        "toObject": toObject,
    }
    return self;

})();/// <reference path="../../config/config.js" />
/// <reference path="../../utilities/dom_utilities.js" />
/// <reference path="../../utilities/rollback_state.js" />
/// <reference path="../../utilities/message_bus.js" />
/// <reference path="../../control/goto_goal/goto_goal_model.js" />
/// <reference path="../../view/view_state_tools.js" />
/// <reference path="../../view/view_validation_tools.js" />
/// <reference path="../../view/view_widget_tools.js" />
/// <reference path="../../view/widget/range/range_widget_controller.js" />
/// <reference path="../../command/rover_command.js" />


/**
 * @typedef {object} GotoGoalViewControllerType
 * @property {() => boolean} isModelBound
 * @property {(gotoGoalModel: GotoGoalModelType) => GotoGoalViewControllerType} bindModel
 * @property {() => GotoGoalViewControllerType} unbindModel
 * @property {() => boolean} isViewAttached
 * @property {() => GotoGoalViewControllerType} attachView
 * @property {() => GotoGoalViewControllerType} detachView
 * @property {() => boolean} isListening
 * @property {() => GotoGoalViewControllerType} startListening
 * @property {() => GotoGoalViewControllerType} stopListening
 * @property {() => boolean} isViewShowing
 * @property {() => GotoGoalViewControllerType} showView
 * @property {() => GotoGoalViewControllerType} hideView
 * @property {(force?: boolean) => GotoGoalViewControllerType} updateView
 * @property {(message: string, data: any, specifier?: string | undefined) => void} onMessage
 */


/**
 * View controller for Goto Goal parameters
 * 
 * Controller lifecycle
 * - attachView()
 * - bindModel()
 * - startListening()
 * - showView()
 * 
 * 
 * @param {RoverCommanderType} roverCommand 
 * @param {string} cssContainer                  // css selector for the widget container element
 * @param {string} cssXInput                     // css selector for the x position input element
 * @param {string} cssYInput                     // css selector for tbe y position input element
 * @param {string} cssToleranceInput             // css selector for the goal tolerance input element
 * @param {string} cssForwardPointRange          // css selector for the 
 * @param {string} cssOkButton 
 * @param {string} cssCancelButton 
 * @param {MessageBusType | undefined} messageBus // IN : MessageBus to listen for goto-update messages
 * @returns {GotoGoalViewControllerType}
 */
function GotoGoalViewController(
    roverCommand, 
    cssContainer, 
    cssXInput, 
    cssYInput, 
    cssToleranceInput, 
    cssForwardPointRange, 
    cssOkButton,
    cssCancelButton,
    messageBus = undefined) 
{
    const defaultState = {
        x: 0.0,                 // goal's x position
        xValid: false,          // true x is a valid number
        y: 0.0,                 // goal's y position 
        yValid: false,          // true if y is a valid number
        tolerance: 0.0,         // error tolerance
        toleranceValid: false,  // true if tolerance is a valid number
        pointForward: 0.75,     // forward point as fraction of wheelbase
        pointForwardLive: 0.75, // forward point as fraction of wheelbase, live drag value
        okEnabled: false,       // true of ok button can be clicked
    };

    // separate state for each wheel
    const _state = RollbackState(defaultState);
    let _syncModel = false;   // true to send the model values to the rover

    /** @type {HTMLElement} */
    let _container = undefined;

    /** @type {HTMLInputElement} */
    let _xInput = undefined;

    /** @type {HTMLInputElement} */
    let _yInput = undefined;

    /** @type {HTMLInputElement} */
    let _toleranceInput = undefined;

    /** @type {HTMLButtonElement} */
    let _okButton = undefined;

    /** @type {HTMLButtonElement} */
    let _cancelButton = undefined;

    /** @type {GotoGoalModelType} */
    let _model = undefined;

    // range widget controller for forward point
    const _pointForwardRange = RangeWidgetController(
        _state, "pointForward", "pointForwardLive", 
        1.0, 0.5, 0.01, 2, 
        cssForwardPointRange);

    /**
     * Initialize the state from the model
     * 
     * @param {GotoGoalModelType} model
     */
    function _initState(model) {
        _state.setValue("x", model.x());
        _state.setValue("xValid", typeof model.x() === "number");
        _state.setValue("y", model.y());
        _state.setValue("yValid", typeof model.y() === "number");
        _state.setValue("tolerance", model.tolerance());
        _state.setValue("toleranceValid", typeof model.tolerance() === "number");
        _state.setValue("pointForward", model.pointForward());
        _state.setValue("okEnabled", false);

        _syncModel = false;
    }

    /**
     * Copy state to the Goto Goal model.
     * 
     * @param {GotoGoalModelType} model 
     */
    function _syncState(model) {
        model.setX(_state.getValue("x"));
        model.setY(_state.getValue("y"));
        model.setTolerance(_state.getValue("tolerance"));
        model.setPointForward(_state.getValue("pointForward"));

        _syncModel = false;
    }

    /**
     * Determine if there is a model
     * bound for updating.
     * 
     * @returns {boolean} // RET: true if model is bound, false if not
     */
    function isModelBound() {
        return !!_model;
    }

    /**
     * Bind the model, so we can update it
     * when the view is committed.
     * 
     * @param {GotoGoalModelType} gotoGoalModel // IN : GotoGoalModel to bind
     * @returns {GotoGoalViewControllerType}    // RET: this GotoGoalViewController
     * @throws {Error | TypeError}              // EXC: Error if model is already bound
     *                                                  TypeError if model is not an object type
     */
    function bindModel(gotoGoalModel) {
        if(isModelBound()) throw Error("bindModel called before unbindModel");
        if(typeof gotoGoalModel !== "object") throw TypeError("missing GotoGoalModel");

        // intialize the _state from the _model
        _model = gotoGoalModel;
        _initState(_model);

        return self;
    }

    /**
     * unbind the model
     */
    function unbindModel() {
        _model = undefined;
        return self;
    }

    /**
     * Determine if controller is bound to the DOM.
     * 
     * @returns {boolean}
     */
    function isViewAttached() // RET: true if view is in attached state
    {
        return !!_container;
    }

    /**
     * Bind the controller to the DOM.
     * This used the css selectors passed to the constructor
     * to find the controller's DOM elements.
     * 
     * @returns {GotoGoalViewControllerType}
     */
    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);
        _xInput = _container.querySelector(cssXInput);
        _yInput = _container.querySelector(cssYInput);
        _toleranceInput = _container.querySelector(cssToleranceInput);
        _okButton = _container.querySelector(cssOkButton);
        _cancelButton = _container.querySelector(cssCancelButton);
        _pointForwardRange.attachView();

        updateView(true);   // sync view with state

        return self;
    }

    /**
     * Unbind the controller from the DOM.
     * 
     * NOTE: This will fail if the controller is actively 
     *       listening for DOM events.
     * 
     * @returns {GotoGoalViewControllerType}
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if (isViewAttached()) {
            _container = undefined;
            _xInput = undefined;
            _yInput = undefined;
            _toleranceInput = undefined;
            _okButton = undefined;
            _cancelButton = undefined;
            _pointForwardRange.detachView();
        }

        return self;
    }

    let _listening = 0;

    /**
     * Determine if the controller is actively listening
     * for DOM events.
     * 
     * @returns {boolean}
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * Start listening for DOM Events.
     * 
     * NOTE: Each call to startListening must be balanced with a
     *       call to stopListening in order to stop listening.
     * 
     * NOTE: This fails if the view is not attached.
     * 
     * @returns {GotoGoalViewControllerType}
     */
    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            if(isViewAttached()) {
                _xInput.addEventListener("input", _onXInput);
                _yInput.addEventListener("input", _onYInput);
                _toleranceInput.addEventListener("input", _onToleranceInput);

                _pointForwardRange.startListening();

                _okButton.addEventListener("click", _onOkButton);
                _cancelButton.addEventListener("click", _onCancelButton)

                if(messageBus) {
                    messageBus.subscribe("goto-update", self);
                }
            }
        }

        if(isListening()) {
            _updateLoop(performance.now());
        }

        return self;
    }

    /**
     * Stop listening for DOM Events.
     * 
     * NOTE: Each call to startListening must be balanced with a
     *       call to stopListening in order to stop listening.
     * 
     * NOTE: This fails if the view is not attached.
     * 
     * @returns {GotoGoalViewControllerType}
     */
    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {

            if(isViewAttached()) {
                _xInput.removeEventListener("input", _onXInput);
                _yInput.removeEventListener("input", _onYInput);
                _toleranceInput.removeEventListener("input", _onToleranceInput);

                _pointForwardRange.stopListening();

                _okButton.removeEventListener("click", _onOkButton);
                _cancelButton.removeEventListener("click", _onCancelButton)

                if(messageBus) {
                    messageBus.unsubscribe("goto-update", self);
                }
            }
            window.cancelAnimationFrame(_animationFrameNumber);
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    /**
     * Determine if the view is showing/enabled.
     * 
     * @returns {boolean}
     */
    function isViewShowing() {
        return _showing > 0;
    }

    /**
     * Show and enable the view.
     * 
     * NOTE: Calls to showView() must be balanced with calls to hideView()
     *       for the view to be hidden.
     * 
     * NOTE: This fails if the view is not attached. 
     * 
     * @returns {GotoGoalViewControllerType}
     */
    function showView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    /**
     * Hide and disable the view.
     * 
     * NOTE: Calls to showView() must be balanced with calls to hideView()
     *       for the view to be hidden.
     * 
     * NOTE: This fails if the view is not attached. 
     * 
     * @returns {GotoGoalViewControllerType} // RET: this controller for fluent chain calling
     */
    function hideView() {
        if (!isViewAttached()) {
            console.log("Attempt to hide a detached view is ignored.");
            return self;
        }

        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * @summary Update view state and render the view if changed.
     * @description The view backing state is updated and if there are 
     *              changes or force is true, then the redraw the
     *              affected view elements.
     * 
     * @param {boolean} force                // IN : true to force update, 
     *                                               false to update only on change
     * @returns {GotoGoalViewControllerType} // RET: this controller for fluent chain calling
     */
    function updateView(force = false) {
        // make sure live state matches state of record
        _pointForwardRange.updateViewState(force);
        _enforceView(force);
        return self;
    }

    /**
     * Event handler that is called when x input is changed.
     * This updates the state with the new value.
     * 
     * @param {Event & {target: {value: string}}} event 
     */
    function _onXInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "x", "xValid", event.target.value);
    }

    /**
     * Event handler that is called when y input is changed.
     * This updates the state with the new value.
     * 
     * @param {Event & {target: {value: string}}} event 
     */
    function _onYInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "y", "yValid", event.target.value);
    }

    /**
     * Event handler that is called when tolerance input is changed.
     * This updates the state with the new value.
     * 
     * @param {Event & {target: {value: string}}} event 
     */
    function _onToleranceInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "tolerance", "toleranceValid", event.target.value);
    }

    /**
     * Event handler that is called when the ok button is clicked.
     * This synchronizes the state with the model and
     * sends the goto goal commad to the rover.
     * 
     * @param {Event & {target: {value: string}}} event 
     */
    function _onOkButton(event) {
        //
        // TODO: copy state to model and send model to rover
        //
        _syncState(_model);
        roverCommand.sendGotoGoalCommand(_model.x(), _model.y(), _model.tolerance(), _model.pointForward());
        console.log("_onOkButton");
    }

    /**
     * Event handler that is called when the cancel button is clicked.
     * This re-initializes the state with the model and
     * sends the halt command to the rover.
     * 
     * @param {Event & {target: {value: string}}} event 
     */
    function _onCancelButton(event) {
        // revert to original model values
        _initState(_model);
        roverCommand.sendHaltCommand();
    }

    /**
     * Message handler to handle the 'ACHIEVED' or 'NOT_RUNNING' message
     * 
     * @param {string} message 
     * @param {any} data 
     * @param {string | undefined} specifier
     */
    function onMessage(message, data, specifier=undefined) {
        if(message === "goto-update") {
            switch(_model.state()) {
                case "STARTING": {
                    console.log("We are going to our goal.");
                    return;
                }
                case "NOT_RUNNING": {
                    // force ok button to be enabled
                    _syncModel = true;
                    _state.setValue("okEnabled", true);  // re-enable the start button
                    return;
                }
                case "ACHIEVED": {
                    // TODO: something to indicate we have finished.
                    console.log("We arrived at the goal!");
                    return;
                }
            }
        }
    }

    /**
     * Make the view match the state.
     * 
     * @param {boolean} force 
     */
    function _enforceView(force = false) {
        //
        // if any values change, the _syncModel becomes true.
        // if _syncModel is true and all values are valid,
        // then we make the ok button enabled.
        //
        _syncModel = _pointForwardRange.enforceView(force) || _syncModel;
        _syncModel = ViewStateTools.enforceInput(_state, "x", _xInput, force) || _syncModel;
        ViewStateTools.enforceValid(_state, "xValid", _xInput, force); // make text input red if invalid
        _syncModel = ViewStateTools.enforceInput(_state, "y", _yInput, force) || _syncModel;
        ViewStateTools.enforceValid(_state, "yValid", _yInput, force); // make text input red if invalid
        _syncModel = ViewStateTools.enforceInput(_state, "tolerance", _toleranceInput, force) || _syncModel;
        ViewStateTools.enforceValid(_state, "toleranceValid", _toleranceInput, force); // make text input red if invalid
        _state.setValue("okEnabled", _state.getValue("xValid") && _state.getValue("yValid") && _state.getValue("toleranceValid"));
        if(_syncModel && _state.commitValue("okEnabled")) {
            enable(_okButton);
        } else {
            disable(_okButton)
        }
    }

    let _animationFrameNumber = 0;

    /**
     * @description
     * called periodically to 
     * - update the view
     * - sync new values to rover
     * 
     * @param {number} timeStamp 
     */
    function _updateLoop(timeStamp) {
        updateView();

        if (isListening()) {
            _animationFrameNumber = window.requestAnimationFrame(_updateLoop);
        }
    }


    /** @type {GotoGoalViewControllerType} */
    const self = Object.freeze({
        "isModelBound": isModelBound,
        "bindModel": bindModel,
        "unbindModel": unbindModel,
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "updateView": updateView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
        "onMessage": onMessage,
    });

    return self;
}/// <reference path="../../utilities/message_bus.js" />


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
/// <reference path="../../utilities/utilities.js" />
/// <reference path="../../utilities/dom_utilities.js" />
/// <reference path="../../utilities/message_bus.js" />
/// <reference path="../../utilities/rollback_state.js" />
/// <reference path="../../command/rover_command.js" />
/// <reference path="../../view/widget/range/range_widget_controller.js" />
/// <reference path="turtle_keyboard_controller.js" />


///////////////// Rover Command View Controller ////////////////////

/**
 * @summary A view controller for turtle movement control.
 * 
 * @typedef {object} TurtleViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => TurtleViewControllerType} attachView
 * @property {() => TurtleViewControllerType} detachView
 * @property {(force?: boolean) => TurtleViewControllerType} updateView
 * @property {() => boolean} isListening
 * @property {() => TurtleViewControllerType} startListening
 * @property {() => TurtleViewControllerType} stopListening
 * @property {() => TurtleViewControllerType} resetRoverButtons
 * @property {(buttonId: string) => TurtleViewControllerType} stopRoverButton
 * @property {(message: string, data: any, specifier?: string | undefined) => void} onMessage
 */

/**
 * @summary Construct view controller for turtle movement control.
 * 
 * @description
 * This controller provides buttons to move the rover
 * in turtle mode.
 * 
 * @param {RoverCommanderType} roverCommand 
 * @param {MessageBusType} messageBus 
 * @param {string} cssContainer 
 * @param {string} cssRoverButton 
 * @param {string} cssRoverSpeedInput 
 * @returns {TurtleViewControllerType}
 */
function TurtleViewController(
    roverCommand, 
    messageBus, 
    cssContainer, cssRoverButton, cssRoverSpeedInput) 
{
    const _state = RollbackState({
        "speedPercent": 0.9,     // float: 0..1 normalized speed
        "speedPercentLive": 0.9, // float: 0..1 normalized speed live update
        "activeButton": "",      // string: id of active turtle button or empty string if none are active
    });

    /** @type {Element | undefined} */
    let _container = undefined;

    /** @type {string[] | undefined} */
    let _turtleButtonNames = undefined;

    /** @type {HTMLButtonElement[] | undefined} */
    let _turtleButtons = undefined;

    const _speedInput = RangeWidgetController(
        _state, "speedPercent", "speedPercentLive", 
        1.0, 0.0, 0.01, 2, 
        cssRoverSpeedInput)

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function attachView() {
        if(isViewAttached()) throw new Error("Attempt to rebind the view.");

        _container = document.querySelector(cssContainer);
        _turtleButtons = Array.from(_container.querySelectorAll(cssRoverButton));
        _turtleButtonNames = _turtleButtons.map(b => b.id.charAt(0).toUpperCase() + b.id.slice(1));
        _speedInput.attachView();
        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * 
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if(isViewAttached()) {
            _container = undefined;
            _turtleButtons = undefined;
            _turtleButtonNames = undefined;
            _speedInput.detachView();
        }
        return self;
    }

    /**
     * @summary Determine if dom elements have been attached.
     * @returns {boolean}
     */
    function isViewAttached() {
        return !!_turtleButtons;
    }

    //////////// update the view //////////////

    /**
     * Update the view based on the state.
     * Generally, this is called with force=false
     * and updates only happen if state has changed.
     * 
     * @param {boolean} force true to force update of controls
     *                        false to update controls based on staged state
     */
    function updateView(force = false) {
        if (isViewAttached()) {
            _enforceActiveButton(force);
            _speedInput.enforceView(force);
        }
        return self;
    }

    /**
     * @private
     * @summary Update the view state once per frame
     * 
     * @param {number} timestamp 
     */
    function _updateLoop(timestamp) {
        updateView();

        if(isListening()) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_updateLoop);
        }
    }

    /**
     * @summary Reset rover buttons to default state.
     * 
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function resetRoverButtons() {
        if(isViewAttached()) {
            for(let i = 0; i < _turtleButtons.length; i += 1) {
                // reset button text based on button id
                const butt = _turtleButtons[i];
                butt.innerHTML = _turtleButtonNames[i];
                butt.classList.remove("disabled");
                butt.disabled = false;
            }
        }
        return self;
    }

    /**
     * @summary set a button to 'stop' state
     * 
     * @description
     * set the given button to 'stop' state
     * and disable other buttons
     * 
     * @param {string} buttonId 
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function stopRoverButton(buttonId) {
        if(isViewAttached()) {
            for(let i = 0; i < _turtleButtons.length; i += 1) {
                // reset button text based on button id
                const butt = _turtleButtons[i];
                if (buttonId === butt.id) {
                    butt.innerHTML = "Stop";
                    butt.classList.remove("disabled");
                    butt.disabled = false;
                } else {
                    butt.innerHTML = _turtleButtonNames[i];
                    butt.classList.add("disabled");
                    butt.disabled = true;
                }
            }
        }
        return self;
    }

    /**
     * @private
     * @summary Enforce the state of the button controls.
     * 
     * @param {boolean} force true to force update of controls
     *                        false to update controls based on staged state
     */
    function _enforceActiveButton(force = false) {
        if(force || _state.isStaged("activeButton")) {
            const buttonId = _state.commitValue("activeButton");
            if(!buttonId) {
                resetRoverButtons();
            } else {
                stopRoverButton(buttonId);
            }
        }
    }

    /////////////// listen for input ///////////////////
    let _listening = 0;
    let _requestAnimationFrameNumber = 0

    /**
     * @summary Start listening for messages and DOM events.
     * @description
     * This adds event listeners to attached dom elements
     * and subscribes to turtle button messages.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {TurtleViewControllerType} // this controller for fluent chain calling
     */
    function startListening() {
        if(!isViewAttached()) throw new Error("Attempt to start listening before view is bound.");

        _listening += 1;
        if (1 === _listening) {
            if(_turtleButtonNames) {
                _turtleButtons.forEach(el => {
                    //
                    // toggle between the button command and the stop command
                    //
                    el.addEventListener("click", _onButtonClick);
                });
            }

            _speedInput.startListening();

            if(messageBus) {
                messageBus.subscribe(TURTLE_KEY_DOWN, self);
                messageBus.subscribe(TURTLE_KEY_UP, self);
            }
        }

        _requestAnimationFrameNumber = window.requestAnimationFrame(_updateLoop);
        return self;
    }

    /**
     * @summary Stop listening for DOM events.
     * 
     * @description
     * This removes event listeners from attached dom elements
     * and unsubscribes from turtle button messages.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {TurtleViewControllerType} this controller instance for fluent chain calling
     */
    function stopListening() {
        if(!isViewAttached()) throw new Error("Attempt to stop listening to unbound view.");

        _listening -= 1;
        if (0 === _listening) {
            if(_turtleButtons) {
                _turtleButtons.forEach(el => {
                    //
                    // toggle between the button command and the stop command
                    //
                    el.removeEventListener("click", _onButtonClick);
                });
            }

            _speedInput.stopListening();

            if(messageBus) {
                messageBus.unsubscribeAll(self);
            }

            window.cancelAnimationFrame(_requestAnimationFrameNumber);
        }
        return self;
    }

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Handle TURTLE_KEY_UP/DOWN messages
     * 
     * @description
     * Handle TURTLE_KEY_UP/DOWN messages by
     * selecting the button indicated in
     * the message data.
     * 
     * @param {string} message 
     * @param {any} data 
     * @param {string | undefined} specifier 
     */
    function onMessage(message, data, specifier = undefined) {
        switch (message) {
            case TURTLE_KEY_DOWN: {
                _onButtonSelected(data);
                return;
            }
            case TURTLE_KEY_UP: {
                _onButtonUnselected(data);
                return;
            }
            default: {
                console.log("Unhandled message in TurtleViewController");
            }
        }
    }


    /**
     * @private
     * @summary handle turtle button click
     * 
     * @description
     * Handle button click click by 
     * toggling the selected state of the button.
     * When the button becomes 'active' (so it looks
     * pushed) then a corresponding turtle control
     * message is sent to the rover.
     * When the button becomes 'inactive' then
     * a 'stop' message is sent to the rover.
     * 
     * @param {Event & {target: {id: string}}} event 
     */
    function _onButtonClick(event) {
        if (roverCommand.isTurtleCommandName(event.target.id)) {
            const buttonId = /** @type {TurtleCommandName} */(event.target.id);
            if (buttonId === _state.getValue("activeButton")) {
                _onButtonUnselected(buttonId);
            } else {
                _onButtonSelected(buttonId);
            }
        }
    }

    /**
     * @private
     * @summary Select a turtle control button
     * 
     * @description
     * Select the given turtle control button 
     * to make it 'active'  (so it looks
     * pushed) and send a corresponding turtle control
     * message to the rover.
     * 
     * @param {TurtleCommandName} buttonId 
     */
    function _onButtonSelected(buttonId) {
        //
        // if it is the active button,  
        // then revert the button and send 'stop' command
        // if it is not the active button, 
        // then make it active and send it's command
        //
        _state.setValue("activeButton", buttonId);
        roverCommand.enqueueTurtleCommand(buttonId, int(100 * _state.getValue("speedPercent"))); // run button command
    }

    /**
     * @private
     * @summary Deselect a turtle control button
     * 
     * @description
     * Deselect the given turtle control button 
     * to make it 'inactive'  (so it looks
     * un-pushed) and send a 'stop' turtle control
     * message to the rover.
     * 
     * @param {TurtleCommandName} buttonId 
     */
    function _onButtonUnselected(buttonId) {
        _state.setValue("activeButton", "");
        roverCommand.enqueueTurtleCommand("stop", 0); // run stop command
    }

    /** @type {TurtleViewControllerType} */
    const self = Object.freeze({
        "attachView": attachView,
        "detachView": detachView,
        "isViewAttached": isViewAttached,
        "updateView": updateView,
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "resetRoverButtons": resetRoverButtons,
        "stopRoverButton": stopRoverButton,
        "onMessage": onMessage,
    });

    return self;
}
/// <reference path="../utilities/message_bus.js" />
/// <reference path="turtle/turtle_view_controller.js" />
/// <reference path="turtle/turtle_keyboard_controller.js" />
/// <reference path="joystick/gamepad_view_controller.js" />
/// <reference path="goto_goal/goto_goal_view_controller.js" />

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
/// <reference path="../../utilities/dom_utilities.js" />
/// <reference path="../../utilities/rollback_state.js" />
/// <reference path="../../view/view_state_tools.js" />
/// <reference path="../../command/rover_command.js" />
/// <reference path="../../view/widget/range/range_widget_controller.js" />

/**
 * @summary A view controller for the motor values view.
 * @description The controller manages the view for editing
 *              motor stall values and sends any changes
 *              to the rover.
 * 
 * @typedef {object} MotorViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => MotorViewControllerType} attachView
 * @property {() => MotorViewControllerType} detachView
 * @property {() => boolean} isListening
 * @property {() => MotorViewControllerType} startListening
 * @property {() => MotorViewControllerType} stopListening
 * @property {() => boolean} isViewShowing
 * @property {() => MotorViewControllerType} showView
 * @property {() => MotorViewControllerType} hideView
 * @property {(force?: boolean) => MotorViewControllerType} updateView
 */

/**
 * @summary Construct a controller for the motor values view.
 * @description The controller manages the view for editing
 *              motor stall values and sends any changes
 *              to the rover.
 * 
 * @param {RoverCommanderType} roverCommand 
 * @param {string} cssContainer 
 * @param {string} cssMotorOneStall 
 * @param {string} cssMotorTwoStall 
 * @returns {MotorViewControllerType}
 */
function MotorViewController(
    roverCommand, 
    cssContainer, 
    cssMotorOneStall,
    cssMotorTwoStall)
{
    let _syncValues = false;   // true to send the stall values to the rover
    let _lastSyncMs = 0;       // millis of last time we synced values

    //
    // view state
    //
    const _state = RollbackState({
        motorOneStall: 0,     // float: fraction of full throttle below which engine stalls
        motorTwoStall: 0,     // float: fraction of full throttle below which engine stalls
        motorOneStallLive: 0, // float: live update of motorOneStall
        motorTwoStallLive: 0, // float: live update of motorTwoStall
    });

    /**
     * View's dom attachment
     * @type {HTMLElement | undefined}
     */
    let container = undefined;

    const _motorOneStallRange = RangeWidgetController(
        _state, "motorOneStall", "motorOneStallLive", 
        1.0, 0.0, 0.01, 2, 
        cssMotorOneStall);

    const _motorTwoStallRange = RangeWidgetController(
        _state, "motorTwoStall", "motorTwoStallLive", 
        1.0, 0.0, 0.01, 2, 
        cssMotorTwoStall);

    /**
     * Determine if controller is attached to DOM.
     * 
     * @returns {boolean}
     */
    function isViewAttached() {
        return !!container;
    }

    /**
     * @summary Bind the controller to the DOM.
     * @description Lookup the dom elements specified by the css selectors
     *              passed to the constructor.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function attachView() {
        if (!isViewAttached()) {
            container = document.querySelector(cssContainer);

            _motorOneStallRange.attachView();
            _motorTwoStallRange.attachView();
        }
        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * @description release references to the DOM.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function detachView() {
        if (isListening()) throw new Error("Attempt to detachView while still listening");
        if (isViewAttached()) {
            container = undefined;

            _motorOneStallRange.detachView();
            _motorTwoStallRange.detachView();
        }
        return self;
    }

    //
    // bind view listeners
    //
    let _listening = 0;

    /**
     * @summary Determine if listening for messages and DOM events.
     * 
     * @returns {boolean}
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for messages and DOM events.
     * @description Enable message processing and DOM event listeners.
     *              NOTE: Each call to startListening() must be balanced
     *              with a call to stopListening() for listeners to be 
     *              deactivated.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function startListening() {
        _listening += 1;
        if (1 === _listening) {
            _motorOneStallRange.startListening();
            _motorTwoStallRange.startListening();
        }

        // start updating
        if(_listening) {
            _gameloop(performance.now());
        }
        return self;
    }

    /**
     * @summary Stop listening for messages and DOM events.
     * @description Disable message processing and DOM event listeners.
     *              NOTE: Each call to startListening() must be balanced
     *              with a call to stopListening() for listeners to be 
     *              deactivated.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            _motorOneStallRange.stopListening();
            _motorTwoStallRange.stopListening();

            // stop updating
            window.cancelAnimationFrame(_animationFrameNumber);
        }
        return self;
    }

    //
    // view visibility
    //
    let showing = 0;

    /**
     * @summary Determine if view is showing/enabled.
     * 
     * @returns {boolean}
     */
    function isViewShowing() {
        return showing > 0;
    }

    /**
     * @summary Show the controller's DOM elements.
     * @description showView() increments a count and hideView() decrements it.
     *              When the count is positive then the view is showing/enabled.
     *              When the count goes to zero the view is hidden/disabled.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function showView() {
        showing += 1;
        if (1 === showing) {
            show(container);
        }
        return self;
    }

    /**
     * @summary Hide the controller's DOM elements.
     * @description showView() increments a count and hideView() decrements it.
     *              When the count is positive then the view is showing/enabled.
     *              When the count goes to zero the view is hidden/disabled.
     * 
     * @returns {MotorViewControllerType} // RET: this controller for fluent chain calling.
     */
    function hideView() {
        showing -= 1;
        if (0 === showing) {
            hide(container);
        }
        return self;
    }

    /**
     * @summary Update the view state and render the view if changed.
     * @description The view backing state is updated and if there are 
     *              changes or force is true, then the redraw the
     *              affected view elements.
     * 
     * @param {boolean} force // RET: 
     * @returns 
     */
    function updateView(force = false) {
        _motorOneStallRange.updateViewState(force);
        _motorTwoStallRange.updateViewState(force);
        _enforceView(force);
        return self;
    }

    /**
     * @summary Make the view reflect the view state.
     * @description If the view state has changed OR 
     *              force = true then update
     *              the associated view elements so they
     *              are redrawn so they match the state.
     * 
     * @param {boolean} force 
     */
    function _enforceView(force = false) {
        _syncValues = _motorOneStallRange.enforceView(force) || _syncValues;
        _syncValues = _motorTwoStallRange.enforceView(force) || _syncValues;
    }

    /**
     * @summary Determine if the motor stall value is valid.
     * 
     * @param {number} value // IN: motor stall value to validate
     * @returns {boolean}    // RET: true if valid, false if not
     */
    function _isMotorStallValid(value) {
        return (typeof value == "number") && (value >= 0) && (value <= 1);
    }

    /**
     * @summary Send any motor stall value change to rover.
     * @description If _syncValues flag indicates that the motor stall value
     *              has changed, then send the new values to the rover.
     *              This is rate limited to so we don't overload the rover
     *              communication.
     */
    function _syncMotorStall() {
        if(_syncValues) {
            if(roverCommand) {
                // rate limit to once per second
                const now = new Date();
                if(now.getTime() >= (_lastSyncMs + 1000)) {
                    const motorOneStall = _state.getValue("motorOneStall");
                    const motorTwoStall = _state.getValue("motorTwoStall");
                    if(_isMotorStallValid(motorOneStall) && _isMotorStallValid(motorTwoStall)) {
                        roverCommand.syncMotorStall(motorOneStall, motorTwoStall);

                        _syncValues = false;
                        _lastSyncMs = now.getTime();
                    }
                }
            }
        }
    }

    let _animationFrameNumber = 0;

    /**
     * @summary Periodically update view and sync values to rover.
     * @description This function is called periodically to
     *              keep the view updated and to synchronize (send)
     *              updated motor control values to the rover.
     * 
     * @param {number} timeStamp 
     */
    function _gameloop(timeStamp) {
        updateView();
        _syncMotorStall();

        if (_listening) {
            _animationFrameNumber = window.requestAnimationFrame(_gameloop);
        }
    }

    /** @type {MotorViewControllerType} */
    const self = {
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
        "updateView": updateView,
    }

    return self;
}/// <reference path="../../config/config.js" />
/// <reference path="../../config/wheels.js" />

/**
 * @typedef WheelControlValues
 * @property {number} minSpeed  // measured value for minium speed of motors
 * @property {number} maxSpeed  // measured value for maximum speed of motors
 * @property {number} Kp        // speed controller proportial gain
 * @property {number} Ki        // speed controller integral gain
 * @property {number} Kd        // speed controller derivative gain
 */

/**
 * @typedef SpeedControlValues
 * @property {boolean} useSpeedControl
 */

/**
 * @typedef {object} SpeedControlModelType
 * @property {() => boolean} useSpeedControl
 * @property {(useSpeedControl: boolean) => SpeedControlModelType} setUseSpeedControl
 * @property {(wheelName: string) => number} minimumSpeed
 * @property {(wheelName: string, minSpeed: number) => SpeedControlModelType} setMinimumSpeed
 * @property {(wheelName: string) => number} maximumSpeed
 * @property {(wheelName: string, maxSpeed: number) => SpeedControlModelType} setMaximumSpeed
 * @property {(wheelName: string) => number} Kp
 * @property {(wheelName: string, Kp: number) => SpeedControlModelType} setKp
 * @property {(wheelName: string) => number} Ki
 * @property {(wheelName: string, Ki: number) => SpeedControlModelType} setKi
 * @property {(wheelName: string) => number} Kd
 * @property {(wheelName: string, Kd: number) => SpeedControlModelType} setKd
 * @property {(wheelName: string) => SpeedControlValues & WheelControlValues} toObject
 */

/**
 * Singleton to hold speed control state.
 * 
 * @type {SpeedControlModelType}
 */
const SpeedControlModel = (function() {

    /** @type {WheelControlValues} */
    const _defaultControlValues =  {
        minSpeed: 0.0,              // measured value for minium speed of motors
        maxSpeed: 0.0,              // measured value for maximum speed of motors 
        Kp: 0.0,                    // speed controller proportial gain
        Ki: 0.0,                    // speed controller integral gain
        Kd: 0.0,                    // speed controller derivative gain
    };

    /** @type {WheelControlValues[]} */
    let _wheel = [{..._defaultControlValues}, {..._defaultControlValues}];
    let _useSpeedControl = false;

    /**
     * Determine is speed control is used.
     * @returns {boolean} true if speed control is in use, false otherwise
     */
    function useSpeedControl() { return _useSpeedControl; }

    /**
     * Turn speed control on or off.
     * 
     * @param {boolean} useSpeedControl  // IN : true to turn speed control on,
     *                                           false to turn speed control off.
     * @returns {SpeedControlModelType}  // RET: self for fluent chain calls
     */
    function setUseSpeedControl(useSpeedControl) {
        _useSpeedControl = useSpeedControl;
        return self;
    }

    /**
     * Get the minimum speed control value for given wheel.
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function minimumSpeed(wheelName) {
        return _wheel[Wheels.index(wheelName)].minSpeed;
    }

    /**
     * Set minimum speed control value for the given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} minSpeed 
     * @returns {SpeedControlModelType}  // RET: self for fluent chain calls
     */
    function setMinimumSpeed(wheelName, minSpeed) {
        _wheel[Wheels.index(wheelName)].minSpeed = minSpeed;
        return self;
    }

    /**
     * Get maximum speed control value for given wheel
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function maximumSpeed(wheelName) {
        return _wheel[Wheels.index(wheelName)].maxSpeed;
    }

    /**
     * Set maximum speed control value for given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} maxSpeed 
     * @returns {SpeedControlModelType} // RET: self for fluent chain calling.
     */
    function setMaximumSpeed(wheelName, maxSpeed) {
        _wheel[Wheels.index(wheelName)].maxSpeed = maxSpeed;
        return self;
    }

    /**
     * Get proportial gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function Kp(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kp;
    }

    /**
     * Set proportional gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} Kp 
     * @returns {SpeedControlModelType} // RET: self for fluent chain calls.
     */
    function setKp(wheelName, Kp) {
        _wheel[Wheels.index(wheelName)].Kp = Kp;
        return self;
    }

    /**
     * Get integral gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function Ki(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kp;
    }

    /**
     * Set integral gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} Ki 
     * @returns {SpeedControlModelType} // RET: self for fluent chain calls.
     */
    function setKi(wheelName, Ki) {
        _wheel[Wheels.index(wheelName)].Ki = Ki;
        return self;
    }

    /**
     * Get derivative gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @returns {number}
     */
    function Kd(wheelName) {
        return _wheel[Wheels.index(wheelName)].Kd;
    }

    /**
     * Set derivative gain control value for given wheel.
     * 
     * @param {string} wheelName 
     * @param {number} Kd
     * @returns {SpeedControlModelType} // RET: self for fluent chain calls.
     */
    function setKd(wheelName, Kd) {
        _wheel[Wheels.index(wheelName)].Kd = Kd;
        return self;
    }

    /**
     * Convert wheel state to object
     * 
     * @param {string} wheelName 
     * @returns {SpeedControlValues & WheelControlValues}
     */
    function toObject(wheelName) {
        return {
            "useSpeedControl": useSpeedControl(),
            "minSpeed": minimumSpeed(wheelName),
            "maxSpeed": maximumSpeed(wheelName),
            "Kp": Kp(wheelName),
            "Ki": Ki(wheelName),
            "Kd": Kd(wheelName),
        };
    }

    /** @type {SpeedControlModelType} */
    const self = Object.freeze({
        "useSpeedControl": useSpeedControl,
        "setUseSpeedControl": setUseSpeedControl,
        "minimumSpeed": minimumSpeed,
        "setMinimumSpeed": setMinimumSpeed,
        "maximumSpeed": maximumSpeed,
        "setMaximumSpeed": setMaximumSpeed,
        "Kp": Kp,
        "setKp": setKp,
        "Ki": Ki,
        "setKi": setKi,
        "Kd": Kd,
        "setKd": setKd,
        "toObject": toObject,
    });
    
    return self;
})();/// <reference path="../../config/config.js" />
/// <reference path="../../utilities/utilities.js" />
/// <reference path="../../utilities/dom_utilities.js" />
/// <reference path="../../view/view_validation_tools.js" />
/// <reference path="../../view/view_state_tools.js" />
/// <reference path="../../utilities/rollback_state.js" />
/// <reference path="../../command/rover_command.js" />
/// <reference path="speed_control_model.js" />


/**
 * @typedef {object} SpeedViewControllerType
 * @property {() => boolean} isModelBound
 * @property {(speedControlModel: SpeedControlModelType) => SpeedViewControllerType} bindModel
 * @property {() => SpeedViewControllerType} unbindModel
 * @property {() => boolean} isViewAttached
 * @property {() => SpeedViewControllerType} attachView
 * @property {() => SpeedViewControllerType} detachView
 * @property {() => boolean} isListening
 * @property {() => SpeedViewControllerType} startListening
 * @property {() => SpeedViewControllerType} stopListening
 * @property {() => boolean} isViewShowing
 * @property {() => SpeedViewControllerType} showView
 * @property {() => SpeedViewControllerType} hideView
 * @property {(force?: boolean) => SpeedViewControllerType} updateView
 */

/**
 * View controller for speed control tab panel
 * 
 * @param {RoverCommanderType} roverCommand 
 * @param {string} cssContainer    // IN s
 * @param {string} cssControlMode  // IN : initial control mode to activate
 * @param {string[]} cssMinSpeed   // IN : min-speed input selector for each wheel
 * @param {string[]} cssMaxSpeed   // IN : max speed input selector for each wheel
 * @param {string[]} cssKpInput    // IN : Kp proportional gain input selector for each wheel
 * @param {string[]} cssKiInput    // IN : Ki integral gain input selector for each wheel
 * @param {string[]} cssKdInput    // IN : Kd derivative gain input selector for each wheel
 * @returns {SpeedViewControllerType}
 */
function SpeedViewController(
    roverCommand, 
    cssContainer, cssControlMode, 
    cssMinSpeed, cssMaxSpeed, 
    cssKpInput, cssKiInput, cssKdInput) // IN : RangeWidgetController selectors
{

    const defaultState = {
        useSpeedControl: false,     // true to have rover use speed control
                                    // false to have rover use raw pwm values with no control
        minSpeed: 0.0,              // measured value for minium speed of motors
                                    // (speed below which the motor stalls)
        minSpeedValid: false,       // true if min speed control contains a valid value
                                    // false if min speed control contains an invalid value
        maxSpeed: 0.0,              // measured value for maximum speed of motors 
                                    // (it is best to choose the lowest maximum of the two motors)
        maxSpeedValid: false,       // true if max speed control contains a valid value
                                    // false if max speed control contains an invalid value
        Kp: 0.0,                    // speed controller proportial gain
        Ki: 0.0,                    // speed controller integral gain
        Kd: 0.0,                    // speed controller derivative gain
        KpValid: true,              // true if proportial gain contains a valid value
                                    // false if not
        KiValid: true,              // true if integral gain contains a valid value
                                    // false if not
        KdValid: true,              // true if derivative gain contains a valid value
                                    // false if not
    };

    // separate state for each wheel
    const _state = [
        RollbackState(defaultState), 
        RollbackState(defaultState)
    ];

    /** @type {HTMLElement | undefined} */
    let _container = undefined;

    /** @type {HTMLInputElement | undefined} */
    let _speedControlCheck = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _minSpeedText = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _maxSpeedText = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _KpGainText = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _KiGainText = undefined;

    /** @type {HTMLInputElement[] | undefined} */
    let _KdGainText = undefined;

    /** @type {SpeedControlModelType | undefined} */
    let _model = undefined;

    let _sendSpeedControl = false;
    let _useSpeedControlChanged = false;
    let _lastSendMs = 0;


    /**
     * @summary Determine if there is a model bound for updating.
     * 
     * @returns {boolean} // RET: true if model is bound, false if not
     */
    function isModelBound() {
        return !!_model;
    }

    /**
     * @summary Bind the model, so we can update it
     * when the view is committed.
     * 
     * @param {SpeedControlModelType} speedControlModel // IN : SpeedControlModel to bind
     * @returns {SpeedViewControllerType}               // RET: this SpeedViewController
     */
    function bindModel(speedControlModel) {
        if(isModelBound()) throw Error("bindModel called before unbindModel");
        if(typeof speedControlModel !== "object") throw TypeError("missing SpeedControlModel");

        // intialize the _state from the _model
        _model = speedControlModel;
        for(let i = 0; i < _state.length; i += 1) {
            const wheelState = _state[i];
            const wheelName = Wheels.name(i);
            wheelState.setValue("useSpeedControl", _model.useSpeedControl());
            wheelState.setValue("minSpeed", _model.minimumSpeed(wheelName));
            wheelState.setValue("maxSpeed", _model.maximumSpeed(wheelName));
            wheelState.setValue("Kp", _model.Kp(wheelName));
            wheelState.setValue("Ki", _model.Ki(wheelName));
            wheelState.setValue("Kd", _model.Kd(wheelName));
        }

        return self;
    }

    /**
     * @summary unbind the model
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function unbindModel() {
        _model = undefined;
        return self;
    }
            
    /**
     * @summary Determine if controller is bound to DOM.
     * 
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    function isViewAttached() // RET: true if view is in attached state
    {
        return !!_container;
    }

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);

        _speedControlCheck = _container.querySelector(cssControlMode);

        // cssXxxx is a list of selectors
        _minSpeedText = cssMinSpeed.map(selector => _container.querySelector(selector));
        _maxSpeedText = cssMaxSpeed.map(selector => _container.querySelector(selector));
        _KpGainText = cssKpInput.map(selector => _container.querySelector(selector));
        _KiGainText = cssKiInput.map(selector => _container.querySelector(selector));
        _KdGainText = cssKdInput.map(selector => _container.querySelector(selector));

        updateView(true);   // sync view with state

        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * 
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        if (isViewAttached()) {
            _container = undefined;
            _speedControlCheck = undefined;
            _minSpeedText = undefined;
            _maxSpeedText = undefined;
            _KpGainText = undefined;
            _KiGainText = undefined;
            _KdGainText = undefined;
        }
        return self;
    }

    let _listening = 0;

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for DOM events.
     * @description
     * This adds event listeners to attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            if(isViewAttached()) {
                _speedControlCheck.addEventListener("change", _onSpeedControlChecked);

                // each of these is a list of elements
                _minSpeedText.forEach(e => e.addEventListener("input", _onMinSpeedChanged));
                _maxSpeedText.forEach(e => e.addEventListener("input", _onMaxSpeedChanged));
                _KpGainText.forEach(e => e.addEventListener("input", _onKpGainChanged));
                _KiGainText.forEach(e => e.addEventListener("input", _onKiGainChanged));
                _KdGainText.forEach(e => e.addEventListener("input", _onKdGainChanged));
            }
        }

        if(isListening()) {
            _updateLoop(performance.now());
        }

        return self;
    }

    let _requestAnimationFrameNumber = 0;

    /**
     * @summary Stop listening for DOM events.
     * @description
     * This removes event listeners from attached dom elements.
     * 
     * >> NOTE: the view must be attached.
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
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {

            if(isViewAttached()) {
                _speedControlCheck.removeEventListener("change", _onSpeedControlChecked);

                // each of these is a list of elements
                _minSpeedText.forEach(e => e.removeEventListener("input", _onMinSpeedChanged));
                _maxSpeedText.forEach(e => e.removeEventListener("input", _onMaxSpeedChanged));
                _KpGainText.forEach(e => e.removeEventListener("input", _onKpGainChanged));
                _KiGainText.forEach(e => e.removeEventListener("input", _onKiGainChanged));
                _KdGainText.forEach(e => e.removeEventListener("input", _onKdGainChanged));
            }
            window.cancelAnimationFrame(_requestAnimationFrameNumber);
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    /**
     * @summary Determine if the view is showing.
     * 
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    function isViewShowing() {
        return _showing > 0;
    }

    /**
     * @summary Show/Enable the view.
     * 
     * @description
     * Show the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function showView() {
        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    /**
     * @summary Hide/Disable the view.
     * 
     * @description
     * Hide the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * @summary Update view state and render if changed.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns {SpeedViewControllerType} this controller instance for fluent chain calling
     */
    function updateView(force = false) {
        // make sure live state matches state of record
        _enforceView(force);
        return self;
    }

    /**
     * @private
     * @summary Event handler called when speed control checkbox changes.
     * @param {Event & {target: {checked: boolean}}} event 
     */
    function _onSpeedControlChecked(event) {
        // update state to cause a redraw on game loop
        _state.forEach(s => s.setValue("useSpeedControl", event.target.checked));
    }

    /**
     * @private
     * @summary Select the correct _state[x] given selectors and an id.
     * 
     * @param {string[]} selectors            // IN : list of selectors to check
     * @param {string} id                     // IN : element id
     * @returns {RollbackStateType|undefined} // RET: rollback state if a selector matches id
     *                                        //      or undefined if no selector matches id
     */
    function _selectState(selectors, id) {
        for(let i = 0; i < selectors.length; i += 1) {
            if(selectors[i] === ("#" + id)) {
                return _state[i];
            }
        }
        return undefined;
    }

    /**
     * @private
     * @summary Event handler called when min speed input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onMinSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssMinSpeed, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "minSpeed", "minSpeedValid", event.target.value, 0.0);
        }
    }

    /**
     * @private
     * @summary Event handler called when max speed input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onMaxSpeedChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssMaxSpeed, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "maxSpeed", "maxSpeedValid", event.target.value, 0.0);
        }
    }

    /**
     * @private
     * @summary Event handler called when Kp gain input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onKpGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKpInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Kp", "KpValid", event.target.value);
        }
    }

    /**
     * @private
     * @summary Event handler called when Ki gain input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onKiGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKiInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Ki", "KiValid", event.target.value);
        }
    }

    /**
     * @private
     * @summary Event handler called when Kd gain input changes.
     * 
     * @param {Event & {target: {id: string, value: string}}} event 
     */
    function _onKdGainChanged(event) {
        // update state to cause a redraw on game loop
        const state = _selectState(cssKdInput, event.target.id);
        if(state) {
            ViewStateTools.updateNumericState(state, "Kd", "KdValid", event.target.value);
        }
    }

    /**
     * @private
     * @summary Make the view match the state.
     * @description
     * If the view state has changes (or force == true)
     * then make the view match the view state.
     * 
     * @param {boolean} force 
     */
    function _enforceView(force = false) {
        //
        // if any of the speed control parameters change, 
        // then send them to the rover.
        //
        // if the useSpeedControl changes, we want to force sending of 'off'
        //
        _useSpeedControlChanged = ViewStateTools.enforceCheck(_state[0], "useSpeedControl", _speedControlCheck, force) || _useSpeedControlChanged;
        _sendSpeedControl = _useSpeedControlChanged || _sendSpeedControl;

        for(let i = 0; i < _state.length; i += 1) {
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "maxSpeed", _maxSpeedText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "maxSpeedValid", _maxSpeedText[i], force); // make text input red if invalid
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "minSpeed", _minSpeedText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "minSpeedValid", _minSpeedText[i], force); // make text input red if invalid
            
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "Kp", _KpGainText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "KpValid", _KpGainText[i], force); // make text input red if invalid
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "Ki", _KiGainText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "KiValid", _KiGainText[i], force); // make text input red if invalid
            _sendSpeedControl = ViewStateTools.enforceInput(_state[i], "Kd", _KdGainText[i], force) || _sendSpeedControl;
            ViewStateTools.enforceValid(_state[i], "KdValid", _KdGainText[i], force); // make text input red if invalid
        }
    }

    /**
     * @private
     * @summary Write changes to speed control parameters to the rover.
     */
    function _syncSpeedControl() {
        if(_sendSpeedControl) {
            if(roverCommand) {
                // rate limit to once per second
                const now = new Date();
                if(now.getTime() >= (_lastSendMs + 1000)) {
                    const useSpeedControl = _state[0].getValue("useSpeedControl");
                    if(typeof useSpeedControl == "boolean") {
                        if(useSpeedControl) {
                            // only send valid data
                            for(let i = 0; i < _state.length; i += 1) {
                                const minSpeed = _state[i].getValue("minSpeed");
                                const maxSpeed = _state[i].getValue("maxSpeed");
                                const Kp = _state[i].getValue("Kp")
                                const Ki = _state[i].getValue("Ki")
                                const Kd = _state[i].getValue("Kd")
                                if(isValidNumber(minSpeed, 0) 
                                    && isValidNumber(maxSpeed, minSpeed, undefined, true)
                                    && isValidNumber(Kp)
                                    && isValidNumber(Ki)
                                    && isValidNumber(Kd)) 
                                {
                                    roverCommand.syncSpeedControl(
                                        Wheels.id(i),   // bit flag for wheel
                                        true,
                                        minSpeed, maxSpeed, 
                                        Kp, Ki, Kd);

                                    _useSpeedControlChanged = false;
                                    _sendSpeedControl = false;
                                    _lastSendMs = now.getTime();

                                    // publish settings change
                                    if(isModelBound()) {
                                        const wheelName = Wheels.name(i);
                                        _model.setUseSpeedControl(useSpeedControl);
                                        _model.setMinimumSpeed(wheelName, minSpeed);
                                        _model.setMaximumSpeed(wheelName, maxSpeed);
                                        _model.setKp(wheelName, Kp);
                                        _model.setKi(wheelName, Ki);
                                        _model.setKd(wheelName, Kd);
                                    }
                                }
                            }
                        } else if(_useSpeedControlChanged){
                            //
                            // if useSpeedControl is off, the only change we care
                            // about is if useSpeedControl itself changed
                            //
                            roverCommand.syncSpeedControl(Wheels.id("left") + Wheels.id("right"), false, 0, 0, 0, 0, 0);
                            _useSpeedControlChanged = false;
                            _sendSpeedControl = false;
                            _lastSendMs = now.getTime();

                            // publish settings change
                            if(isModelBound()) {
                                _model.setUseSpeedControl(false);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * called periodically to 
     * - update the view
     * - sync new values to rover
     * 
     * @param {*} timeStamp 
     */
    function _updateLoop(timeStamp) {
        updateView();
        _syncSpeedControl();

        if (isListening()) {
            _requestAnimationFrameNumber = window.requestAnimationFrame(_updateLoop);
        }
    }

    /** @type {SpeedViewControllerType} */
    const self = Object.freeze({
        "isModelBound": isModelBound,
        "bindModel": bindModel,
        "unbindModel": unbindModel,
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "updateView": updateView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
    });

    return self;
}/// <reference path="config/config.js" />
/// <reference path="utilities/dom_utilities.js" />
/// <reference path="utilities/message_bus.js" />
/// <reference path="utilities/rollback_state.js" />
/// <reference path="camera/streaming_socket.js" />
/// <reference path="view/widget/canvas/canvas_view_controller.js" />
/// <reference path="view/widget/tabs/tab_view_controller.js" />
/// <reference path="control/rover_view_manager.js" />
/// <reference path="telemetry/motor/telemetry_canvas_painter.js" />
/// <reference path="telemetry/pose/pose_canvas_painter.js" />
/// <reference path="telemetry/telemetry_view_manager.js" />
/// <reference path="calibration/motor/motor_view_controller.js" />
/// <reference path="calibration/pid/speed_view_controller.js" />


//
// TODO: implement a rover reset command that restarts encoder and pose from zero.
//


///////////////// main //////////////////
document.addEventListener('DOMContentLoaded', function (event) {
    var baseHost = document.location.origin

    /**
     * update the element's value
     * and optionally send the change
     * to the server (default is true)
     * 
     * @param {Element} el 
     * @param {any} value 
     * @param {boolean | null} updateRemote 
     */
    const updateValue = (el, value, updateRemote) => {
        updateRemote = updateRemote == null ? true : updateRemote
        let initialValue
        if ((el instanceof HTMLInputElement) && (el.type === 'checkbox')) {
            initialValue = el.checked
            value = !!value
            el.checked = value
        } else {
            initialValue = get_value(el)
            set_value(el, value)
        }

        if (updateRemote && initialValue !== value) {
            updateConfig(el);
        } else if (!updateRemote) {
            if (el.id === "aec") {
                value ? hide(exposure) : show(exposure)
            } else if (el.id === "agc") {
                if (value) {
                    show(gainCeiling)
                    hide(agcGain)
                } else {
                    hide(gainCeiling)
                    show(agcGain)
                }
            } else if (el.id === "awb_gain") {
                value ? show(wb) : hide(wb)
            }
        }
    }

    /**
     * update the element's corresponding config on the remote server
     * using a fetch request.
     * 
     * @param {Element} el 
     */
    function updateConfig(el) {
        let value = undefined
        if (el instanceof HTMLInputElement) {
            switch (el.type) {
                case 'checkbox':
                    value = el.checked ? 1 : 0
                    break
                case 'range':
                case 'select-one':
                    value = el.value
                    break
                case 'button':
                case 'submit':
                    value = '1'
                    break
            }
        } else if (el instanceof HTMLSelectElement) {
            if (el.type == 'select-one') {
                value = el.value;
            }
        }

        if (value != undefined) {
            const query = `${baseHost}/control?var=${el.id}&val=${value}`

            fetch(query)
                .then(response => {
                    console.log(`request to ${query} finished, status: ${response.status}`)
                })
        }
    }

    //
    // Add a handler to all close buttons
    // which 'closes' the parent element 
    // when clicked.
    //
    document
        .querySelectorAll('.close')
        .forEach(el => {
            if (el instanceof HTMLElement) {
                el.onclick = () => {
                    hide(el.parentElement)
                }
            }
        })

    // 
    // call the /status endpoint to read all 
    // initial camera values as json
    // and update each value locally.
    // Delay 2 seconds to give camera time to start.
    //
    setTimeout(() => {
        fetch(`${baseHost}/status`)
            .then(function (response) {
                return response.json()
            })
            .then(function (state) {
                for (const [key, value] of Object.entries(state)) {
                    console.log(`${key}: ${value}`);
                    if("enabled" === key) {
                        // hide or show camera controls
                        const doHideShow = value ? show : hide
                        document
                            .querySelectorAll('.camera-ui')
                            .forEach(el => {
                                doHideShow(el)
                            })
                    } else {
                        let el = document.querySelector(`#${key}.default-action`);
                        if(el) {
                            updateValue(el, value, false);
                        }
                    }
                }
                  
                // document
                //     .querySelectorAll('.default-action')
                //     .forEach(el => {
                //         if(state.hasOwnProperty(el.id)) {
                //             updateValue(el, state[el.id], false)
                //         }
                //     })
            })
    }, 2000);

    
    const view = /** @type {HTMLImageElement} */(document.getElementById('stream'))
    const viewContainer = document.getElementById('stream-container')
    const stillButton = document.getElementById('get-still')
    const streamButton = document.getElementById('toggle-stream')
    const closeButton = document.getElementById('close-stream')

    //
    // create instances of the control modules
    //
    /** @type {MessageBusType} */
    const messageBus = MessageBus();

    const streamingSocket = StreamingSocket(location.hostname, 81, view);
    const commandSocket = CommandSocket(location.hostname, 82, messageBus);
    const roverCommand = RoverCommand(baseHost, commandSocket);

    const joystickContainer = document.getElementById("joystick-control");
    const joystickViewController = GamePadViewController(joystickContainer, 
        "#joystick-control > .selector > .select-gamepad ",                                                                     // gamepad select element
        "#joystick-control > .selector > .axis-one", "#joystick-control > .selector > .axis-two",                                   // axis select element
        "#joystick-control > .axis-one-value > .control-value", "#joystick-control > .axis-two-value > .control-value",             // axis value element
        "#joystick-control > .axis-one-zero",   // axis zero range widget
        "#joystick-control > .axis-two-zero",   // axis zero range widget
        "#joystick-control > .axis-one-flip > .switch > input[type=checkbox]", "#joystick-control > .axis-two-flip > .switch > input[type=checkbox]",   // axis flip checkbox element
        messageBus);

    const tankContainer = document.getElementById("tank-control");
    const tankViewController = GamePadViewController(tankContainer, 
        "#tank-control > .selector > .select-gamepad ",                                                                     // gamepad select element
        "#tank-control > .selector > .axis-one", "#tank-control > .selector > .axis-two",                                   // axis select element
        "#tank-control > .axis-one-value > .control-value", "#tank-control > .axis-two-value > .control-value",             // axis value element
        "#tank-control > .axis-one-zero", "#tank-control > .axis-two-zero",         
        "#tank-control > .axis-one-flip > .switch > input[type=checkbox]", "#tank-control > .axis-two-flip > .switch > input[type=checkbox]",   // axis flip checkbox element
        messageBus);

    const gotoGoalViewController = GotoGoalViewController(
        roverCommand, 
        "#goto-goal-control", 
        "#goto_goal_x", 
        "#goto_goal_y", 
        "#goto_goal_tolerance", 
        "#point-forward-group",
        "#goto_goal_start",
        "#goto_goal_cancel",
        messageBus);

    const motorViewController = MotorViewController( 
        roverCommand,
        "#motor-values",
        "#motor-values .motor-one-stall",
        "#motor-values .motor-two-stall",
    );

    const speedViewController = SpeedViewController(
        roverCommand,
        "#pid-values",
        "#use_speed_control",
        ["#min_speed_0", "#min_speed_1"],
        ["#max_speed_0", "#max_speed_1"],
        ["#proportional_gain_0", "#proportional_gain_1"],
        ["#integral_gain_0", "#integral_gain_1"],
        ["#derivative_gain_0", "#derivative_gain_1"],
    );

    //
    // realtime rover telemetry plotter
    //
    const leftTelemetryListener = TelemetryListener(messageBus, "telemetry", "left", config.telemetryBufferSize());
    const rightTelemetryListener = TelemetryListener(messageBus, "telemetry", "right", config.telemetryBufferSize());
    const telemetryViewController = CanvasViewController(
        "#motor-telemetry", 
        "canvas", 
        TelemetryCanvasPainter(leftTelemetryListener, rightTelemetryListener, SpeedControlModel),
        messageBus,
        "telemetry-update");
    const resetTelemetryViewController = ResetTelemetryViewController(
        undefined, 
        [leftTelemetryListener, rightTelemetryListener], 
        "#motor-telemetry-container .okcancel-container", 
        "#reset-telemetry");
    
    const poseTelemetryListener = TelemetryListener(messageBus, "pose", "pose", config.poseTelemetrySize());
    const poseTelemetryViewController = CanvasViewController(
        "#pose-telemetry", 
        "canvas", 
        PoseCanvasPainter(poseTelemetryListener),
        messageBus,
        "pose-update");
    const resetPoseViewController = ResetTelemetryViewController(
        roverCommand.sendResetPoseCommand, 
        [poseTelemetryListener], 
        "#pose-telemetry-container .okcancel-container", 
        "#reset-pose");

    const telemetryTabController = TabViewController("#rover-telemetry-tabs", ".tablinks", messageBus);
    const telemetryViewManager = TelemetryViewManager(
        messageBus, 
        telemetryViewController,
        resetTelemetryViewController, 
        poseTelemetryViewController, 
        resetPoseViewController);

    const turtleKeyboardControl = TurtleKeyboardController(messageBus);
    const turtleViewController = TurtleViewController(roverCommand, messageBus, '#turtle-control', 'button.rover', '#rover_speed-group');
    
    const roverViewManager = RoverViewManager(
        roverCommand, 
        messageBus, 
        turtleViewController, 
        turtleKeyboardControl, 
        tankViewController, 
        joystickViewController, 
        gotoGoalViewController);
    const roverTabController = TabViewController("#rover-control", ".tablinks", messageBus);

    const configTabController = TabViewController("#configuration-tabs", ".tablinks", messageBus);

    const gotoGoalModelListener = TelemetryModelListener(messageBus, "goto", "goto", GotoGoalModel);
    
    //
    // start the turtle rover control system
    //
    commandSocket.start();  // start socket for sending commands
    roverCommand.start();   // start processing rover commands

    // start listening for input
    turtleViewController.attachView().updateView(true).startListening();
    turtleKeyboardControl.startListening();
    tankViewController.attachView();
    joystickViewController.attachView();
    roverTabController.attachView().startListening();
    roverViewManager.startListening();
    motorViewController.attachView().updateView(true).showView().startListening();
    speedViewController.bindModel(SpeedControlModel).attachView().updateView(true).hideView().startListening();
    configTabController.attachView().startListening();
    leftTelemetryListener.startListening();
    rightTelemetryListener.startListening();
    telemetryViewController.attachView().updateView(true).showView().startListening();
    poseTelemetryViewController.attachView().updateView(true).showView().startListening();
    resetPoseViewController.attachView().showView().startListening();
    resetTelemetryViewController.attachView().showView().startListening();
    telemetryTabController.attachView().startListening();
    telemetryViewManager.startListening();
    poseTelemetryListener.startListening();
    gotoGoalModelListener.startListening();
    gotoGoalViewController.bindModel(GotoGoalModel).attachView().updateView(true);

    // -------- setup camera UI --------------- //
    const stopStream = () => {
        streamingSocket.stop();
        view.onload = null;
        streamButton.innerHTML = 'Start Stream'
    }

    let startTimestamp = 0;
    let frameCount = 0;
    const startStream = () => {
        // websocket listener will start showing frames
        streamingSocket.start();
        show(viewContainer)
        streamButton.innerHTML = 'Stop Stream'
    }

    // Attach actions to buttons
    stillButton.onclick = () => {
        stopStream()
        view.src = `${baseHost}/capture?_cb=${Date.now()}`
        show(viewContainer)
    }

    closeButton.onclick = () => {
        stopStream()
        hide(viewContainer)
    }

    streamButton.onclick = () => {
        const streamEnabled = streamButton.innerHTML === 'Stop Stream'
        if (streamEnabled) {
            stopStream()
        } else {
            startStream()
        }
    }


    //
    // make sure select and range controls don't
    // respond to keyboard keys because
    // it conflicts with the rover control
    //
    document.querySelectorAll('input[type=range]').forEach(el => {
        (/** @type {HTMLElement} */(el)).onkeydown = (event) => {
            event.preventDefault()
        }
    });
    document.querySelectorAll('select').forEach(el => {
        el.onkeydown = (event) => {
            event.preventDefault()
        }
    });

    // Attach default on change action
    document.querySelectorAll('.default-action').forEach(el => {
        (/** @type {HTMLElement} */(el)).onchange = () => updateConfig(el)
    })

    // Custom actions
    // Gain
    const agc = document.getElementById('agc')
    const agcGain = document.getElementById('agc_gain-group')
    const gainCeiling = document.getElementById('gainceiling-group')
    agc.onchange = () => {
        updateConfig(agc)
        if (get_checked(agc)) {
            show(gainCeiling)
            hide(agcGain)
        } else {
            hide(gainCeiling)
            show(agcGain)
        }
    }

    // Exposure
    const aec = document.getElementById('aec')
    const exposure = document.getElementById('aec_value-group')
    aec.onchange = () => {
        updateConfig(aec)
        get_checked(aec) ? hide(exposure) : show(exposure)
    }

    // AWB
    const awb = document.getElementById('awb_gain')
    const wb = document.getElementById('wb_mode-group')
    awb.onchange = () => {
        updateConfig(awb)
        get_checked(awb) ? show(wb) : hide(wb)
    }

    const framesize = document.getElementById('framesize')

    framesize.onchange = () => {
        updateConfig(framesize)
    }
})
