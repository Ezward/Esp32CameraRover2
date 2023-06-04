#ifndef GOTO_GOAL_H
#define GOTO_GOAL_H

#include "../../config.h"
#include "../rover.h"
#include "../../common/message_bus/message_bus.h"
#include "../pose.h"


typedef enum {
    NOT_RUNNING,
    STARTING,
    RUNNING,
    ACHIEVED,
    NUMBER_OF_GOTO_GOAL_STATES, // SHOULD ALWAYS BE LAST
} GotoGoalState;

typedef enum {
    GOTO_NONE,
    GOTO_STOP,
    GOTO_ANGLE,
    GOTO_POINT,
} GotoGoalAction;

extern const char *GotoGoalStateStr[NUMBER_OF_GOTO_GOAL_STATES];

/**
 * Go to a goal point specified in world coordinates.
 * This behavior uses the 'Point Forward Controller'
 * scheme whereby a point is chosen just slightly
 * forward of the wheel center along the rover's
 * local x-axis and that point's velocity
 * is controlled.  That creates useful steering
 * behaviors and avoids instabilities in the 
 * standard PID controller.  
 * See http://faculty.salina.k-state.edu/tim/robot_prog/MobileBot/Steering/pointFwd.html
 */
class GotoGoalBehavior : public Publisher, public Subscriber {
    private:
    // attached dependencies
    TwoWheelRover* _rover;
    MessageBus *_messageBus = nullptr;

    distance_type _forward = 0;
    distance_type _K = 0;

    GotoGoalState _state = NOT_RUNNING;
    GotoGoalAction _action = GOTO_NONE;
    Pose2D _goal = {0, 0, 0};
    distance_type _fractionForward;
    distance_type _goalTolerance = 0;
    distance_type _angleTolerance = 0;

    public:

    GotoGoalBehavior()
        :  Publisher(BEHAVIOR_SPEC), Subscriber()
    {
    }

    ~GotoGoalBehavior() {
        detach();
    }

    Pose2D goal() {
        return _goal;
    }
    
    GotoGoalState state() {
        return _state;
    }


    /**
     * Deteremine if dependencies are attached
     */
    bool attached(); // RET: true if attached, false if not

    /**
     * Attach dependencies
     */
    GotoGoalBehavior& attach(
        TwoWheelRover& rover,   // IN : rover that get's behavior
        MessageBus& messageBus);// IN : MessageBus to subscribe rover pose updates
                                // RET: this behavior in attached state

    /**
     * Detach dependencies
     */
    GotoGoalBehavior& detach(); // RET: this behavior in detached state

    /**
     * Start listening for ROVER_POSE messages
     */
    GotoGoalBehavior& startListening();    // RET: this behavior

    /**
     * Stop listening for ROVER_POSE messages
     */
    GotoGoalBehavior& stopListening(); // RET: this behavior

    /**
     * Handle a subscribed message from a publisher
     */
    void onMessage(
        Publisher &publisher,       // IN : publisher of message
        Message message,            // IN : message that was published
        Specifier specifier,        // IN : specifier (like LEFT_WHEEL_SPEC)
        const char *data);          // IN : message data as a c-cstring

    /**
     * Start the behavior
     */
    GotoGoalBehavior& gotoGoal(
        distance_type x,            // IN : goal's horizontal position in world coordinates
        distance_type y,            // IN : goal's vertical position in world coordinates
        distance_type pointForward, // IN : point forward as fraction of wheelbase
        distance_type tolerance);   // IN : tolerance in error term
                                    // RET: this behavior

    /**
     * Cancel the behavior IF it is running
     */
    GotoGoalBehavior& cancel(); // RET: this behavior 

    /**
     * Run the behavior and update rover velocities.
     * Publish messages when goal is achieved.
     */
    GotoGoalBehavior& poll(unsigned long currentMillis); // RET: this behavior

    private:

    /**
     * Run the behavior and update rover velocities.
     */
    bool gotoStop(
        unsigned long currentMillis); // IN : current time in milliseconds
                                      // RET: true while achieving goal,
                                      //      false if goal achieved OR not RUNNING state 

    /**
     * Run the behavior and update rover velocities.
     */
    bool gotoTurn(
        unsigned long currentMillis); // IN : current time in milliseconds
                                      // RET: true while achieving goal,
                                      //      false if goal achieved OR not RUNNING state 

    /**
     * Run the behavior and update rover velocities.
     */
    bool gotoAngle(
        unsigned long currentMillis); // IN : current time in milliseconds
                                      // RET: true while achieving goal,
                                      //      false if goal achieved OR not RUNNING state 
    /**
     * Run the behavior and update rover velocities.
     */
    bool gotoPoint(
        unsigned long currentMillis); // IN : current time in milliseconds
                                      // RET: true while achieving goal,
                                      //      false if goal achieved OR not RUNNING state 

};


#endif // GOTO_GOAL_H