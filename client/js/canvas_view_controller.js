/// <reference path="dom_utilities.js" />
/// <reference path="canvas_painter.js" />
/// <reference path="message_bus.js" />

/**
 * Construct controller for resizable, paintable canvas.
 * 
 * When canvas is resized, it's coordinate system
 * is reset to the pixel coordinates and the canvasPainter
 * is called to repaint the canvas.
 * 
 * @param {string} cssContainer 
 * @param {string} cssCanvas 
 * @param {CanvasPainterType} canvasPainter 
 * @param {MessageBusType} messageBus
 * @param {string} updateMessage
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
     * 
     * @returns {boolean}
     */
    const isViewAttached = () => // RET: true if view is in attached state
    {
        return !!_container;
    }

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
    const isListening = () => {
        return _listening > 0;
    }

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

    const isViewShowing = () => {
        return _showing > 0;
    }

    const showView = () => {
        _showing += 1;
        if (1 === _showing) {
            _dirtySize = true;
            show(_container);
        }
        return self;
    }

    const hideView = () => {
        _showing -= 1;
        if (0 === _showing) {
            hide(_container);
        }
        return self;
    }

    const updateView = (force = false) => {
        if(force || _dirtyCanvas) {
            canvasPainter.paint();
            _dirtyCanvas = false;
        }
        return self;
    }

    const _updateSize = (force = false) => {
        if(force || _dirtySize) {
            _setCanvasSize();
            _dirtyCanvas = true;    // force a redraw
            _dirtySize = false;
            return true;
        }
        return false;
    }

    const _onResize = (event) => {
        _updateSize(true);
    }

    const onMessage = (message, data) => {
        if(message === updateMessage) {
            // mark canvas as dirty
            _dirtyCanvas = true;
        }
    }

    const _updateLoop = (timeStamp) => {
        _updateSize();  // resize before redrawing
        updateView();

        if (isListening()) {
            _animationFrame = window.requestAnimationFrame(_updateLoop);
        }
    }

    const self = {
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
    };

    return self;
}
