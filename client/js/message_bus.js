
/**
 * Interface that message bus subscribers must implement,
 * 
 * @typedef {Object} SubscriberType
 * @property {(message: string, data: any, subscriber?: string) => void} onMessage
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
