/// <reference path="config.js" />
/// <reference path="rollback_state.js" />
/// <reference path="message_bus.js" />
/// <reference path="goto_goal_model.js" />
/// <reference path="view_state_tools.js" />
/// <reference path="view_validation_tools.js" />
/// <reference path="view_widget_tools.js" />
/// <reference path="range_widget_controller.js" />
/// <reference path="rover_command.js" />


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
 * @param {string} cssContainer 
 * @param {string} cssXInput 
 * @param {string} cssYInput 
 * @param {string} cssToleranceInput 
 * @param {string} cssForwardPointRange 
 * @param {string} cssOkButton 
 * @param {string} cssCancelButton 
 * @returns {GotoGoalViewControllerType}
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
}