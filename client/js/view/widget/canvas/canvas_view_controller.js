/// <reference path="../../../utilities/dom_utilities.js" />
/// <reference path="canvas_painter.js" />
/// <reference path="../../../utilities/message_bus.js" />

/**
 * @summary View controller for resizable, paintable canvas
 * @typedef {object} CanvasViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => CanvasViewControllerType} attachView
 * @property {() => CanvasViewControllerType} detachView
 * @property {() => boolean} isViewShowing
 * @property {() => CanvasViewControllerType} showView
 * @property {() => CanvasViewControllerType} hideView
 * @property {(force?: boolean) => CanvasViewControllerType} updateView
 * @property {() => boolean} isListening
 * @property {() => CanvasViewControllerType} startListening
 * @property {() => CanvasViewControllerType} stopListening
 * @property {(message: any, data: any, specifier?: string | undefined) => void} onMessage
 */

/**
 * @summary Construct view controller for resizable, paintable canvas.
 * 
 * @description
 * Construct view controller for resizable, paintable canvas.
 * When canvas is resized, it's coordinate system
 * is reset to the pixel coordinates and the canvasPainter
 * is called to repaint the canvas.
 * 
 * @param {string} cssContainer 
 * @param {string} cssCanvas 
 * @param {CanvasPainterType} canvasPainter 
 * @param {MessageBusType} messageBus
 * @param {string} updateMessage
 * @returns {CanvasViewControllerType}
 */
function CanvasViewController(cssContainer, cssCanvas, canvasPainter, messageBus, updateMessage) {
    /** @private @type {HTMLElement} The parent element of the HtmlCanvasElement. */
    let _container = undefined;

    /** @private @type {HTMLCanvasElement | undefined}  Canvas element to draw on. */
    let _canvas = undefined;

    /** @private @type {boolean} True if canvas must be redraw. */
    let _dirtyCanvas = true;

    /** @private @type {boolean} True if canvas was resized. */
    let _dirtySize = true;

    /** @type {number} */
    let _animationFrame = 0

    /** 
     * Synchronize the Canvas' size and the element's size so we are dealing with pixel coordinates. 
     * @private 
     * @type {() => void} 
     */
    const _setCanvasSize = () => {
        // make canvas coordinates match element size
        _canvas.width = _canvas.clientWidth;
        _canvas.height = _canvas.clientHeight;
    }

    /**
     * @summary Determine if controller is bound to DOM.
     * 
     * @returns {boolean} // RET: true if controller is in bound to DOM
     *                    //      false if controller is not bound to DOM
     */
    const isViewAttached = () => // RET: true if view is in attached state
    {
        return !!_container;
    }

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const attachView = () => {
        if (isViewAttached()) {
            console.log("Attempt to attach canvas view twice is ignored.");
            return self;
        }

        _container = document.querySelector(cssContainer);
        _canvas = _container.querySelector(cssCanvas);
        _setCanvasSize();

        canvasPainter.attachCanvas(_canvas);

        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * 
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const detachView = () => {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        _container = undefined;
        _canvas = undefined;

        canvasPainter.detachCanvas();

        return self;
    }

    let _listening = 0;

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    const isListening = () => {
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
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const startListening = () => {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            _container.addEventListener("resize", _onResize);

            // 
            // if there is an update message,
            // then start listening for it.
            //
            if((!!messageBus) && (typeof updateMessage === "string")) {
                messageBus.subscribe(updateMessage, self);
            }
        }

        if(isListening()) {
            _dirtySize = true;  // bit of a hack, but critical 
                                // for canvas to pickup initial
                                // size while it's tab container
                                // is visible; before tab controller
                                // initializes, which may hide it.
            _updateLoop(performance.now());
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
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const stopListening = () => {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {
            _container.removeEventListener("resize", _onResize);

            // 
            // stop listening for update message,
            //
            if((!!messageBus) && (typeof updateMessage === "string")) {
                messageBus.unsubscribe(updateMessage, self);
            }

            window.cancelAnimationFrame(_animationFrame);
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
    const isViewShowing = () => {
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
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const showView = () => {
        _showing += 1;
        if (1 === _showing) {
            _dirtySize = true;
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
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const hideView = () => {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    /**
     * @summary Update view state and render if changed.
     * 
     * @param {boolean} force true to force update, 
     *                        false to update only on change
     * @returns {CanvasViewControllerType} this controller instance for fluent chain calling
     */
    const updateView = (force = false) => {
        if(force || _dirtyCanvas) {
            canvasPainter.paint();
            _dirtyCanvas = false;
        }
        return self;
    }

    /**
     * @summary Update the canvas pixel coordinates
     * when the canvas changes size.
     * 
     * @param {boolean} force // true to force update
     * @returns {boolean}     // true if updated, false if not
     */
    const _updateSize = (force = false) => {
        if(force || _dirtySize) {
            _setCanvasSize();
            _dirtyCanvas = true;    // force a redraw
            _dirtySize = false;
            return true;
        }
        return false;
    }

    /**
     * @summary Event handler called when container resized.
     * 
     * @description
     * This event handler is called with the canvas container 
     * is resized.  It calls _updateSize() to update
     * the canvas pixel coordinates.
     * 
     * @param {Event} event 
     */
    const _onResize = (event) => {
        _updateSize(true);
    }

    /**
     * @summary Handle update message
     * 
     * @description
     * Called with update message, which
     * causes the view to be dirtied so
     * that it is redrawn on the next
     * animation frame.
     * 
     * @param {*} message 
     * @param {*} data 
     * @param {string | undefined} specifier
     */
    const onMessage = (message, data, specifier = undefined) => {
        if(message === updateMessage) {
            // mark canvas as dirty
            _dirtyCanvas = true;
        }
    }

    /**
     * @summary Update view once per animation frame.
     * 
     * @param {number} timeStamp 
     */
    const _updateLoop = (timeStamp) => {
        _updateSize();  // resize before redrawing
        updateView();

        if (isListening()) {
            _animationFrame = window.requestAnimationFrame(_updateLoop);
        }
    }

    /** @type {CanvasViewControllerType} */
    const self = Object.freeze({
        "isViewAttached": isViewAttached,
        "attachView": attachView,
        "detachView": detachView,
        "isViewShowing": isViewShowing,
        "showView": showView,
        "hideView": hideView,
        "updateView": updateView,
        "isListening": isListening,
        "startListening": startListening,
        "stopListening": stopListening,
        "onMessage": onMessage,
    });

    return self;
}
