#include <string.h>

#include "../../test.h"
#include "../../../src/message_bus/message_bus.h"

using namespace std;

MessageBus testMessageBus;
Publisher testPublisher;
int testCount = 0;

void TestSubscribe() {

	//
	// should scan any single character
	//
    class TestSubscriber : public Subscriber {

        virtual void onMessage(
            Publisher &publisher,       // IN : publisher of message
            Message message,            // IN : message that was published
            Specifier specifier)        // IN : specifier (like LEFT_WHEEL)
        {
            if(TEST != message) {
                testError("Subscriber.onMessage send wrong message, %d != %d", TEST, message);
            }
            if(NONE != specifier) {
                testError("Subscriber.onMessage send wrong specifier, %d != %d", NONE, specifier);
            }
            testCount += 1;
        }
    };

    TestSubscriber testSubscriber;

    //
    // this should be ignored (not sent to anyone)
    // because no one is subscribed
    //
    testPublisher.publish(testMessageBus, TEST, NONE);
    if(0 != testCount) {
        testError("Subscriber erroneously received message, 0 != %d", testCount);
    }

    testSubscriber.subscribe(testMessageBus, TEST);
    if(!testMessageBus.subscribed(testSubscriber, TEST)) {
        testError("Subscriber failed to subscribe to TEST message.", TEST);
    }

    //
    // subscribed message should be received
    //
    testPublisher.publish(testMessageBus, TEST, NONE);
    if(1 != testCount) {
        testError("Subscriber failed to get message, 1 != %d", testCount);
    }

    //
    // unsubscribed message should not be received
    //
    testPublisher.publish(testMessageBus, WHEEL_POWER, NONE);
    if(1 != testCount) {
        testError("Subscriber erroneously received unsubscribed message, 1 != %d", testCount);
    }

    //
    // unsubscribe should succeed
    //
    testSubscriber.unsubscribe(testMessageBus, TEST);
    if(testMessageBus.subscribed(testSubscriber, TEST)) {
        testError("Subscriber failed to unsubscribe from TEST message.", TEST);
    }
    testPublisher.publish(testMessageBus, TEST, NONE);
    if(1 != testCount) {
        testError("Subscriber erroneously received unsubscribed message, 1 != %d", testCount);
    }
}

int main() {
    // from test folder run: 
    // gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_strings.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

    TestSubscribe();

    return testResults("message_bus");
}
