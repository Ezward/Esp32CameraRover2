#ifndef MESSAGE_BUS_H
#define MESSAGE_BUS_H

#include "messages.h"

const int MAX_SUBCRIBERS = 8;   // maximum subscribers per message

class MessageBus;

/**
 * Class that can publish to a message bus
 */
class Publisher {
    const Specifier _specifier;

    public:

    Publisher(const Specifier specifier)
        : _specifier(specifier)
    {
        // no-op
    }

    const Specifier specifier() { return _specifier; }
    
    /**
     * Publish to a message bus
     */
    void publish(
        MessageBus &messageBus, // IN : message bus on which to publish
        Message message,        // IN : message to publish
        Specifier specifier);   // IN : specifier (like LEFT_WHEEL)
};
typedef Publisher* PublisherPtr;

/**
 * Class that can subscribe to messages on a message bus
 */
class Subscriber {
    public:
    /**
     * Subscribe to a message from any publisher
     * on the given message bus. 
     */
    void subscribe(
        MessageBus &messageBus, // IN : message bus on which message will be published
        Message message);       // IN : message to subscribe to

    /**
     * Unsubscribe to the given message
     * on the given message bus
     */
    void unsubscribe(
        MessageBus &messageBus, // IN : same message bus as corresponding subscribe()
        Message message);        // IN : same message as corresponding subscribe()

    /**
     * Handle a subscribed message from a publisher
     * NOTE: implement this in your concrete class.
     */
    virtual void onMessage(
        Publisher &publisher,       // IN : publisher of message
        Message message,            // IN : message that was published
        Specifier specifier) = 0;   // IN : specifier (like LEFT_WHEEL)

};
typedef Subscriber* SubscriberPtr;

/**
 * A publish-subscribe system for decoupling code.
 * 
 * Messages are ints defined in messages.h.  
 * 
 * This pub-sub system is designed for low memory
 * embedded applications.  Messages themselves are 
 * not sent with a data payload.  Rather, messages
 * should be used to announce a state change in a system.
 * The subscriber can then call into that system to 
 * get the current state, using the specifier passed 
 * with the message to help determine which system to 
 * call if more than one system can publish the same
 * message.
 */
class MessageBus {
    private:
    SubscriberPtr _subscriptions[NUMBER_OF_MESSAGES][MAX_SUBCRIBERS];

    /**
     * Get index of subscription for given subscriber to given message
     */
    int _subscriptionIndex(
        Subscriber &subscriber, // IN : subscriber to message
        Message message);       // IN : message being subscribed
                                // RET: non-negative index into message subscribers
                                //      - non-null if subscribed, points to subscription
                                //      - null if not subscribed, points to available slot


    public:

    /**
     * Determine if a subscriber is subscribed
     * to a given message.
     */
    bool subscribed(
        Subscriber &subscriber, // IN : subscriber to message
        Message message);       // IN : message being subscribed
                                // RET: true if subscribed to message
                                //      on this message bus


    /**
     * Subscribe to message from any publisher any number of times
     */
    void subscribe(
        Subscriber &subscriber, // IN : subscriber to message
        Message message);       // IN : message being subscribed


    /**
     * Unsubscribe to message
     */
    void unsubscribe(
        Subscriber &subscriber, // IN : subscriber to message
        Message message);       // IN : message being subscribed


    /**
     * Publish a message on the bus
     */
    void publish(
        Publisher &publisher,   // IN : publisher of message
        Message message,        // IN : message to publish
        Specifier specifier);   // IN : message specifier

};

#endif // MESSAGE_BUS_H