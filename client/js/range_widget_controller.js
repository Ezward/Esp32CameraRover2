// import ViewStateTools from './view_state_tools.js'
// import ViewWidgetTools from './view_widget_tools.js'


/**
 * Construct controller for a multi-element range 
 * (slider) control with increment/decrement controls,
 * value display and live update.
 * 
 * @param {RollbackState} rollbackState // IN : state with value and live update value
 *                                      // OUT: state updated on calls to updateView()
 *                                              and/or enforceView()
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
 * @returns {RangeWidgetController}     // RET: RangeWidgetController instance
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
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    function isViewAttached()
    {
        return !!_container;
    }

    /**
     * Bind the controller to the associated DOM elements.
     * NOTE: attaching more than once is ignored.
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
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
     * Unbind the controller from the DOM.
     * NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
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
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * Start listening for events.
     * NOTE: the controller must be attached.
     * NOTE: keeps count of calls to start/stop, 
     *       and balances multiple calls;
     *       - startListening() // true == isListening()
     *       - startListening() // true == isListening()
     *       - stopListening()  // true == isListening()
     *       - stopListening()  // false == isListening()
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
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
     * Stop listening for events.
     * NOTE: the controller must be attached.
     * NOTE: keeps count of calls to start/stop, 
     *       and balances multiple calls;
     *       - startListening() // true == isListening()
     *       - startListening() // true == isListening()
     *       - stopListening()  // true == isListening()
     *       - stopListening()  // false == isListening()
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
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
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    function isViewShowing() {
        return _showing > 0;
    }

    /**
     * Show the view.
     * NOTE: the controller must be attached.
     * NOTE: keeps count of calls to start/stop, 
     *       and balances multiple calls;
     *       - showView()  // true == isViewShowing()
     *       - showView()  // true == isViewShowing()
     *       - hideView()  // true == isViewShowing()
     *       - hideView()  // false == isViewShowing()
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
     */
    function showView() {
        _showing += 1;
        if (1 === _showing) {
            show(_container);
        }
        return self;
    }

    /**
     * Hide the view.
     * NOTE: the controller must be attached.
     * NOTE: keeps count of calls to start/stop, 
     *       and balances multiple calls;
     *       - showView()  // true == isViewShowing()
     *       - showView()  // true == isViewShowing()
     *       - hideView()  // true == isViewShowing()
     *       - hideView()  // false == isViewShowing()
     * 
     * @returns {RangeWidgetController} this RangeWidgetController instance
     */
    function hideView() {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * Update view state and render if changed.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns {RangeWidgetController} this RangeWidgetController instance
     */
    function updateView(force = false) {
        // make sure live state matches state of record
        updateViewState(force).enforceView(force);
        return self;
    }

    /**
     * Update view state.
     * 
     * @param {boolean} force // IN : true to force update, 
     *                        //      false to update only on change.
     * @returns {RangeWidgetController} this RangeWidgetController instance
     */
    function updateViewState(force = false) {
        // make sure live state matches state of record
        if(force || rollbackState.isStaged(key)) {
            rollbackState.setValue(liveKey, rollbackState.getValue(key));
        }
        return self;
    }

    /**
     * Make the view match the state.
     * 
     * @param {boolean} force   // IN : true to force re-render
     * @returns {boolean}       // RET: true if range state value (rollbackState.get(key)) is updated,
     *                                  false otherwise.
     */
    function enforceView(force = false) {
        updated = ViewStateTools.enforceInput(rollbackState, key, _rangeInput, force);
        ViewStateTools.enforceText(rollbackState, liveKey, _rangeText, force || updated);
        return updated; // return true if make state value was updated
    }


    function _onChanged(event) {
        // update state to cause a redraw on game loop
        const value = parseFloat(event.target.value)
        rollbackState.setValue(key, value);
        rollbackState.setValue(liveKey, value);
    }

    function _onLiveUpdate(event) {
        // update state to cause a redraw on game loop
        rollbackState.setValue(liveKey, parseFloat(event.target.value));
    }

    function _onIncrement(event) {
        // update state to cause a redraw on game loop
        ViewWidgetTools.onRangeIncrement(rollbackState, key, liveKey, increment, maxRange, decimals);
    }
    function _onDecrement(event) {
        // update state to cause a redraw on game loop
        ViewWidgetTools.onRangeDecrement(rollbackState, key, liveKey, increment, minRange, decimals);
    }

    const self = {
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
    }

    return self;
}
