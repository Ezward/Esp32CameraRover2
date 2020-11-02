#include "message_bus.h"
#include <assert.h>


/**
 * Publish to a message bus
 */
void Publisher::publish(
    MessageBus &messageBus, // IN : message bus on which to publish
    Message message,        // IN : message to publish
    Specifier specifier)    // IN : specifier (like LEFT_WHEEL)
{
    this->publish(messageBus, message, specifier, "");
}

/**
 * Publish to a message bus with data
 */
void Publisher::publish(
    MessageBus &messageBus, // IN : message bus on which to publish
    Message message,        // IN : message to publish
    Specifier specifier,    // IN : specifier (like LEFT_WHEEL)
    const char *data)       // IN : data as a c-string
{
    messageBus.publish(*this, message, specifier, data);
}


/**
 * Subscribe to a message from any publisher
 * on the given message bus. 
 */
void Subscriber::subscribe(
    MessageBus &messageBus, // IN : message bus on which message will be published
    Message message)        // IN : message to subscribe to
{
    messageBus.subscribe(*this, message);
}

/**
 * Unsubscribe to the given message
 * on the given message bus
 */
void Subscriber::unsubscribe(
    MessageBus &messageBus, // IN : same message bus as corresponding subscribe()
    Message message)        // IN : same message as corresponding subscribe()
{
    messageBus.unsubscribe(*this, message);
}

/**
 * Get index of subscription for given subscriber to given message
 */
int MessageBus::_subscriptionIndex(
    Subscriber &subscriber, // IN : subscriber to message
    Message message)        // IN : message being subscribed
                            // RET: non-negative index into message subscribers
                            //      - non-null if subscribed, points to subscription
                            //      - null if not subscribed, points to available slot
{
    const SubscriberPtr *subscribers = _subscriptions[message];

    int i = 0;
    while(i < MAX_SUBCRIBERS && (nullptr != subscribers[i])) {
        SubscriberPtr s = subscribers[i];
        if(&subscriber == s) {
            return i;   // index of subscriber
        }

        i += 1;
    }

    return i;   // index of next available subscriber slot if < MAX_SUBSCRIBERS
}


/**
 * Determine if a subscriber is subscribed
 * to a given message.
 */
bool MessageBus::subscribed(
    Subscriber &subscriber, // IN : subscriber to message
    Message message)        // IN : message being subscribed
                            // RET: true if subscribed to message
                            //      on this message bus
{
    int i =  _subscriptionIndex(subscriber, message);
    return (i < MAX_SUBCRIBERS) && (nullptr != _subscriptions[message][i]); 
}


/**
 * Subscribe to message from any publisher any number of times
 */
void MessageBus::subscribe(
    Subscriber &subscriber, // IN : subscriber to message
    Message message)        // IN : message being subscribed
{
    //
    // subscribe if not already subscribed
    //
    int i = _subscriptionIndex(subscriber, message);
    if((i < MAX_SUBCRIBERS) && (nullptr == _subscriptions[message][i])) {
        _subscriptions[message][i] = &subscriber;
    }

    // it is bad if we run out of subscriber room.
    // we should have configured enough.
    assert (i != MAX_SUBCRIBERS);
}

/**
 * Unsubscribe to message
 */
void MessageBus::unsubscribe(
    Subscriber &subscriber, // IN : subscriber to message
    Message message)        // IN : message being subscribed
{
    //
    // unsubscribe if subscribed
    // - fill subscriberPtr slot by moving following entries down 
    // - leave nullptr at end of list; this is next available slot
    //
    int i = _subscriptionIndex(subscriber, message);
    if((i < MAX_SUBCRIBERS) && (nullptr != _subscriptions[message][i])) {
        while(i < MAX_SUBCRIBERS - 1) {
            _subscriptions[message][i] = _subscriptions[message][i+1];

            i += 1;
        }

        _subscriptions[message][i] = nullptr;
    }
}


/**
 * Publish a message on the bus
 */
void MessageBus::publish(
    Publisher &publisher,   // IN : publisher of message
    Message message,        // IN : message to publish
    Specifier specifier,    // IN : message specifier
    const char *data)       // IN : data as c-string 
                            //      or NULL for no data
{
    //
    // call onMessage for all subscribers to the message
    //
    SubscriberPtr *subscribers = _subscriptions[message];
    for(int i = 0; i < MAX_SUBCRIBERS && (nullptr != subscribers[i]); i += 1) {
        SubscriberPtr s = subscribers[i];
        s->onMessage(publisher, message, specifier, (nullptr != data) ? data : "");
    }
}
