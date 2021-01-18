
// import RollbackState from './rollback_state.js'
// import ViewStateTools from './view_state_tools.js'
// import ViewValidationTools from './view_validation_tools.js'
// import ViewWidgetTools from './view_widget_tools.js'
// import RangeWidgetController from './range_widget_controller.js'
// import wheelNumber from './config.js'

/**
 * View controller for Goto Goal parameters
 * 
 * @param {*} roverCommand 
 * @param {*} cssContainer 
 * @param {*} cssXInput 
 * @param {*} cssYInput 
 * @param {*} cssToleranceInput 
 * @param {*} cssForwardPointRange 
 * @param {*} cssOkButton 
 * @param {*} cssCancelButton 
 */
function GotoGoalViewController(
    roverCommand, 
    cssContainer, 
    cssXInput, 
    cssYInput, 
    cssToleranceInput, 
    cssForwardPointRange, // IN : RangeWidgetController selectors
    cssOkButton,
    cssCancelButton,
    messageBus = undefined) // IN : MessageBus to listen for goto-update messages
{
    const defaultState = {
        x: 0.0,                 // goal's x position
        xValid: false,          // true x is a valid number
        y: 0.0,                 // goal's y position 
        yValid: false,     // true if y is a valid number
        tolerance: 0.0,         // error tolerance
        toleranceValid: false,  // true if tolerance is a valid number
        pointForward: 0.75,     // forward point as fraction of wheelbase
        pointForwardLive: 0.75, // forward point as fraction of wheelbase, live drag value
        okEnabled: false,       // true of ok button can be clicked
    };

    // separate state for each wheel
    const _state = RollbackState(defaultState);
    let _syncModel = false;   // true to send the model values to the rover

    let _container = undefined;
    let _xInput = undefined;
    let _yInput = undefined;
    let _toleranceInput = undefined;
    let _okButton = undefined;
    let _cancelButton = undefined;

    let _model = undefined;

    // range widget controller for forward point
    const _pointForwardRange = RangeWidgetController(
        _state, "pointForward", "pointForwardLive", 
        1.0, 0.5, 0.01, 2, 
        cssForwardPointRange);

    /**
     * Initialize the state from the model
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
     * @param {object} gotoGoalModel // IN : GotoGoalModel to bind
     * @returns {object}             // RET: this GotoGoalViewController
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
            
    function isViewAttached() // RET: true if view is in attached state
    {
        return !!_container;
    }

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
    function isListening() {
        return _listening > 0;
    }

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
            window.cancelAnimationFrame(_updateLoop);
        }
        return self;
    }

    //
    // view visibility
    //
    let _showing = 0;

    function isViewShowing() {
        return _showing > 0;
    }

    function showView() {
        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    //
    // render/update view
    //
    /**
     * Update view state and render if changed.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns this SpeedViewController
     */
    function updateView(force = false) {
        // make sure live state matches state of record
        _pointForwardRange.updateViewState(force);
        _enforceView(force);
        return self;
    }

    function _onXInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "x", "xValid", event.target.value);
    }
    function _onYInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "y", "yValid", event.target.value);
    }
    function _onToleranceInput(event) {
        // update state to cause a redraw on game loop
        ViewStateTools.updateNumericState(_state, "tolerance", "toleranceValid", event.target.value);
    }

    function _onOkButton(event) {
        //
        // TODO: copy state to model and send model to rover
        //
        _syncState(_model);
        roverCommand.sendGotoGoalCommand(_model.x(), _model.y(), _model.tolerance(), _model.pointForward());
        console.log("_onOkButton");
    }

    function _onCancelButton() {
        // revert to original model values
        _initState(_model);
        roverCommand.sendHaltCommand();
    }

    //
    // handle the 'ACHIEVED' or 'NOT_RUNNING' message
    //
    function onMessage(msg, data) {
        if(msg === "goto-update") {
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


    /**
     * called periodically to 
     * - update the view
     * - sync new values to rover
     * 
     * @param {*} timeStamp 
     */
    function _updateLoop(timeStamp) {
        updateView();

        if (isListening()) {
            window.requestAnimationFrame(_updateLoop);
        }
    }


    const self = {
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
    }
    return self;
}