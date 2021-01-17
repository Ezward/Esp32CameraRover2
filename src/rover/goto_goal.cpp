#include "./goto_goal.h"
#include "../encoder/encoder.h"

const char *GotoGoalStateStr[NUMBER_OF_GOTO_GOAL_STATES] = {
    "NOT_RUNNING",
    "STARTING",
    "RUNNING",
    "ACHIEVED",
};

/**
 * Deteremine if dependencies are attached
 */
bool GotoGoalBehavior::attached() // RET: true if attached, false if not
{
    return (NULL != _rover) && (NULL != _messageBus);
}

/**
 * Attach dependencies
 */
GotoGoalBehavior& GotoGoalBehavior::attach(
    TwoWheelRover& rover,   // IN : rover that get's behavior
    MessageBus& messageBus) // IN : MessageBus to subscribe rover pose updates
                            // RET: this behavior in attached state
{
    if(!attached()) {
        // motors should already be in attached state
        _rover = &rover;
        _messageBus = &messageBus;
    }

    return *this;
}

/**
 * Detach dependencies
 */
GotoGoalBehavior& GotoGoalBehavior::detach() // RET: this behavior in detached state
{
    if(attached()) {
        _rover = nullptr;
        _messageBus = nullptr;
    }

    return *this;
}


/**
 * Start listening for ROVER_POSE messages
 */
GotoGoalBehavior& GotoGoalBehavior::startListening()    // RET: this behavior
{
    if(attached()) {
        _messageBus->subscribe(*this, ROVER_POSE);
    }

    return *this;
}

/**
 * Stop listening for ROVER_POSE messages
 */
GotoGoalBehavior& GotoGoalBehavior::stopListening() // RET: this behavior
{
    if(attached()) {
        _messageBus->unsubscribe(*this, ROVER_POSE);
    }

    return *this;
}

/**
 * Handle a subscribed message from a publisher
 */
void GotoGoalBehavior::onMessage(
    Publisher &publisher,       // IN : publisher of message
    Message message,            // IN : message that was published
    Specifier specifier,        // IN : specifier (like LEFT_WHEEL_SPEC)
    const char *data)           // IN : message data as a c-cstring
{
    // TODO: implement
    switch (message)
    {
        case ROVER_POSE: {
            assert(&publisher == _rover);
            assert(specifier == ROVER_SPEC);
            poll(millis());   // update behavior state
            break;
        }
        case WHEEL_HALT: {
            cancel();
            break;
        }
        default: {
            // NOOP
            break;
        }
    }
}

/**
 * Start the behavior
 */
GotoGoalBehavior& GotoGoalBehavior::gotoGoal(
    distance_type x,              // IN : goal's horizontal position in world coordinates
    distance_type y,              // IN : goal's vertical position in world coordinates
    distance_type pointForward,   // IN : point forward as fraction of wheelbase
    distance_type angleTolerance) // IN : tolerance in error term
                                  // RET: this behavior
{
    if(attached()) {
        if(_state == RUNNING) {
            cancel();
        }

        _goal.x = x;
        _goal.y = y;
        _goal.angle = ATAN2(_goal.y, _goal.x);
        _goalTolerance = 10;
        _angleTolerance = angleTolerance;

        // calculate distance to forward point from fraction of wheelbase
        _fractionForward = pointForward;
        _forward = _rover->wheelBase() * _fractionForward;
        _K = _rover->wheelBase() / (2 * _forward);

        _state = STARTING;

        startListening();   // listen for ROVER_POSE messages from rover
        _messageBus->publish(*this, GOTO_GOAL, BEHAVIOR_SPEC, nullptr);
    }
    return *this;
}

/**
 * Cancel the behavior IF it is running
 */
GotoGoalBehavior& GotoGoalBehavior::cancel() // RET: this behavior
{
    stopListening();
    if(_state == RUNNING) {
        gotoStop(millis());
        _state = NOT_RUNNING;
        _action = GOTO_NONE;
        _messageBus->publish(*this, GOTO_GOAL, BEHAVIOR_SPEC, nullptr);
    }
    return *this;
}



/**
 * Run the behavior and update rover velocities.
 * Publish messages when goal is achieved.
 */
GotoGoalBehavior& GotoGoalBehavior::poll(
    unsigned long currentMillis) // IN : current time in milliseconds
                                 // RET: this behavior
{
    if(attached()) {
        //
        // 1. get current pose and current velocities
        // 2. finish if we have achieved goal, otherwise;
        // 3. calculate delta position to goal
        // 4: calculate wheel velocities
        // 5: set wheel speeds on rover
        //
        // V = sqrt((velocity.x * velocity.x) + (velocity.y * velocity.y))
        // forward.x = pose.x * _forward * cos(pose.angle)
        // forward.y = pose.y * _forward * sin(pose.angle) 
        //
        // Calculate angle between current pose and goal; this is the error
        // goalAngle = atan(goal.y/goal.x)
        // errorAngle -= pose.angle - goalAngle
        //
        // K = L / (2 * _forward)
        // rightVelocity = V * (cos(errorAngle) + K * sin(errorAngle))
        // leftVelocity = V * (cos(errorAngle) - K * sin(errorAngle))
        //
        if(STARTING == _state) {
            _state = RUNNING;
            _action = GOTO_STOP;
        }
        if(RUNNING == _state) {
            switch(_action) {
                case GOTO_STOP: {
                    if(gotoStop(currentMillis)) {
                        _action = GOTO_ANGLE;
                        poll(currentMillis);    // recursive call to start action
                    }
                    break;
                }
                case GOTO_ANGLE: {
                    if(gotoTurn(currentMillis)) {
                        gotoStop(currentMillis);
                        _action = GOTO_POINT;
                        poll(currentMillis);    // recursive call to start action
                    }
                    break;
                }
                case GOTO_POINT: {
                    if(gotoPoint(currentMillis)) {
                        gotoStop(currentMillis);
                        _action = GOTO_NONE;
                        _state = ACHIEVED;

                        // publish ACHIEVED message
                        _messageBus->publish(*this, GOTO_GOAL, BEHAVIOR_SPEC, nullptr);
                    }
                    break;
                }
                case GOTO_NONE: {
                    break;
                }
            }

        }
    }    
    return *this;
}

/**
 * Run the behavior and update rover velocities.
 */
bool GotoGoalBehavior::gotoStop(
    unsigned long currentMillis) // IN : current time in milliseconds
                                 // RET: false if not RUNNING or not goal achieved,
                                 //      true if RUNNING and goal achieved 
{
    if(attached()) {
        if(RUNNING == _state) {
            _rover->roverLeftWheel(false, true, 0);
            _rover->roverRightWheel(false, true, 0);
            return true;
        }
    }    
    return false;
}

bool GotoGoalBehavior::gotoTurn(
    unsigned long currentMillis) // IN : current time in milliseconds
                                 // RET: false if not RUNNING or not goal achieved,
                                 //      true if RUNNING and goal achieved 
{
    if(attached()) {
        if(RUNNING == _state) {

            // we should be pointing at the goal from where we are
            const Pose2D pose = _rover->pose();
            const distance_type goalAngle = ATAN2(_goal.y - pose.y, _goal.x - pose.x);

            // this is the difference between where we should point and where we are pointing
            const distance_type errorAngle = limitAngle(goalAngle - pose.angle);

            const speed_type speedSpan = (_rover->maximumSpeed() - _rover->minimumSpeed());
            const speed_type desiredVelocity = _rover->minimumSpeed() + speedSpan * 0;

            // calculate the smallest turn we can detect based on encoder resolution, wheel size and wheelbase
            const distance_type minimumWheelDistance = (WHEEL_CIRCUMFERENCE * POSE_MIN_ENCODER_COUNT / PULSES_PER_REVOLUTION);
            const distance_type turnCircumference = PI * WHEELBASE;
            const distance_type turnTolerance =  TWOPI * minimumWheelDistance / turnCircumference;  // minimum turn radians that we can measure
            const int comparison = compareTo<distance_type>(errorAngle, 0, turnTolerance);
            if(comparison > 0) {
                //
                // goal is on our left, turn left
                //
                _rover->roverLeftWheel(true, true, - desiredVelocity);
                _rover->roverRightWheel(true, true, desiredVelocity);
            } else if(comparison < 0) {
                //
                // goal is on right, turn right
                //
                _rover->roverLeftWheel(true, true, desiredVelocity);
                _rover->roverRightWheel(true, true, - desiredVelocity);
            } else {
                //
                // we are pointing toward the target, turn is complete
                //
                return true;
            }
        }
    }    
    return false;
}

/**
 * Run the behavior and update rover velocities.
 */
bool GotoGoalBehavior::gotoAngle(
    unsigned long currentMillis) // IN : current time in milliseconds
                                 // RET: false if not RUNNING or not goal achieved,
                                 //      true if RUNNING and goal achieved 
{
    if(attached()) {
        if(RUNNING == _state) {
            const speed_type desiredVelocity = _rover->minimumSpeed() * 1.5;
            const Pose2D pose = _rover->pose();

            // we should be pointing at the goal from where we are
            const distance_type goalAngle = ATAN2(_goal.y - pose.y, _goal.x - pose.x);

            // this is the difference between where we should point and where we are pointing
            const distance_type errorAngle = limitAngle(goalAngle - pose.angle);

            if(0 == compareTo<distance_type>(errorAngle, 0, _angleTolerance)) {
                return true;
            }

            //
            // we are not within angle tolerance, so turn
            //
            const speed_type term1 = COS(errorAngle);
            const speed_type term2 = _K * SIN(errorAngle);
            const speed_type rightVelocity = desiredVelocity * (term1 + term2); // -1.414 <= (term1 + term2) <= 1.414
            const speed_type leftVelocity = desiredVelocity * (term1 - term2);  // -1.414 <= (term1 - term2) <= 1.414

            //
            // don't set velocities in the stall zone
            //
            _rover->roverLeftWheel(true, leftVelocity >= 0, ABS(leftVelocity));
            _rover->roverRightWheel(true, rightVelocity >= 0, ABS(rightVelocity));
        }
    }    
    return false;
}

bool GotoGoalBehavior::gotoPoint(
    unsigned long currentMillis) // IN : current time in milliseconds
                                 // RET: false if not RUNNING or not goal achieved,
                                 //      true if RUNNING and goal achieved 
{
    if(attached()) {
        if(RUNNING == _state) {
            const Pose2D pose = _rover->pose();

            //
            // 1. if we are near goal, we are done
            // 2. otherwise turn towards the goal,
            //

            //
            // calculate the minimum distance we can detect with encoders
            // and use this as the radius of a circle around the goal
            //
            const distance_type minimumWheelDistance = (WHEEL_CIRCUMFERENCE * POSE_MIN_ENCODER_COUNT / PULSES_PER_REVOLUTION);
            if(pointInCircle<distance_type>(pose.x, pose.y, _goal.x, _goal.y, minimumWheelDistance)) {
                return true;
            }

            // we should be pointing at the goal from where we are
            const distance_type goalAngle = ATAN2(_goal.y - pose.y, _goal.x - pose.x);

            // this is the difference between where we should point and where we are pointing
            const distance_type errorAngle = limitAngle(goalAngle - pose.angle);

            //
            // if we are not within angle tolerance, then turn
            //
            const speed_type speedSpan = (_rover->maximumSpeed() - _rover->minimumSpeed()) * 0.25;
            const speed_type desiredVelocity = _rover->minimumSpeed() + speedSpan;
            const speed_type deltaVelocity = max<speed_type>(errorAngle / PI, 1) * speedSpan;
            const int comparison = compareTo<speed_type>(errorAngle, 0, _angleTolerance);

            if(comparison > 0) {
                //
                // goal is on our left, turn left
                //
                _rover->roverLeftWheel(true, true, desiredVelocity - deltaVelocity);
                _rover->roverRightWheel(true, true, desiredVelocity + deltaVelocity);
            } else if(comparison < 0) {
                //
                // goal is on right, turn right
                //
                _rover->roverLeftWheel(true, true, desiredVelocity + deltaVelocity);
                _rover->roverRightWheel(true, true, desiredVelocity - deltaVelocity);
            } else {
                //
                // we are pointing toward the target, go straight
                //
                _rover->roverLeftWheel(true, true, desiredVelocity);
                _rover->roverRightWheel(true, true, desiredVelocity);
            }
        }
    }    
    return false;
}
