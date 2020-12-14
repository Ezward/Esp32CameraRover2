
/////////////// message bus //////////////////
function MessageBus() {
    const subscriptions = {};

    function subscribe(message, subscriber) {
        if (!subscriber) throw new TypeError("Missing subscriber");
        if ("function" !== typeof subscriber["onMessage"]) throw new TypeError("Invalid subscriber");
        if ("string" != typeof message) throw new TypeError("Invalid message");

        let subscribers = subscriptions[message];
        if (!subscribers) {
            subscriptions[message] = (subscribers = []);
        }
        subscribers.push(subscriber);
    }

    function unsubscribe(message, subscriber) {
        const subscribers = subscriptions[message];
        if(subscribers) {
            removeFirstFromList(subscribers, subscriber);
        }
    }

    function unsubscribeAll(subscriber) {
        for(const message in subscriptions) {
            if(subscriptions.hasOwnProperty(message)) {
                const subscribers = subscriptions[message];
                if(subscribers) {
                    removeAllFromList(subscribers, subscriber);
                }
            }
        }
    }

    function publish(message, data = null, specifier = undefined, subscriber = undefined) {
        if ("string" != typeof message) throw new ValueError("Invalid message");

        if (subscriber) {
            // direct message
            if ("function" !== typeof subscriber["onMessage"]) throw new ValueError("Invalid subscriber");

            subscriber.onMessage(message, data, specifier);
        } else {
            // broadcase message
            subscribers = subscriptions[message];
            if (subscribers) {
                subscribers.forEach(subscriber => subscriber.onMessage(message, data, specifier));
            }
        }
    }

    const exports = {
        "publish": publish,
        "subscribe": subscribe,
        "unsubscribe": unsubscribe,
        "unsubscribeAll": unsubscribeAll,
    }

    return exports;
}
