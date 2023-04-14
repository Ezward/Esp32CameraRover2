/// <reference path="dom_utilities.js" />
/// <reference path="view_widget_tools.js" />
/// <reference path="rollback_state.js" />

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
