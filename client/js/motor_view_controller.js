

function MotorViewController(container, cssMotorOneStall, cssMotorTwoStall, cssMotorOneStallText, cssMotorTwoStallText) {

    //
    // view state
    //
    const _state = RollbackState({
        "motorOneStall": 0,     // float: fraction of full throttle below which engine stalls
        "motorTwoStall": 0,     // float: fraction of full throttle below which engine stalls
    });

    function getMotorOneStall() {
        return _state.getValue("motorOneStall");
    }

    function getMotorTwoStall() {
        return _state.getValue("motorTwoStall");
    }

    //
    // view dom attachment
    //
    let motorOneStallRange = undefined;
    let motorTwoStallRange = undefined;
    let motorOneStallText = undefined;
    let motorTwoStallText = undefined;

    function isViewAttached() {
        return !!motorOneStallRange;
    }

    function attachView() {
        if (!isViewAttached()) {
            motorOneStallRange = container.querySelector(cssMotorOneStall);
            motorTwoStallRange = container.querySelector(cssMotorTwoStall);
            motorOneStallText = container.querySelector(cssMotorOneStallText);
            motorTwoStallText = container.querySelector(cssMotorTwoStallText);
        }
        return self;
    }

    function detachView() {
        if (listening) throw new Error("Attempt to detachView while still listening");
        if (isViewAttached()) {
            motorOneStallRange = undefined;
            motorTwoStallRange = undefined;
            motorOneStallText = undefined;
            motorTwoStallText = undefined;
        }
        return self;
    }

    //
    // bind view listeners
    //
    let _listening = 0;
    function isListening() {
        return _listening > 0;
    }

    function startListening() {
        _listening += 1;
        if (1 === _listening) {
            // listen for changes to list of gamepads
            if (motorOneStallRange) {
                motorOneStallRange.addEventListener("change", _onMotorOneStallChanged);
            }
            if (motorTwoStallRange) {
                motorTwoStallRange.addEventListener("change", _onMotorTwoStallChanged);
            }
        }
        if(_listening) {
            _gameloop(performance.now());
        }
        return self;
    }

    function stopListening() {
        _listening -= 1;
        if (0 === _listening) {
            if (motorOneStallRange) {
                motorOneStallRange.removeEventListener("change", _onMotorOneStallChanged);
            }
            if (motorTwoStallRange) {
                motorTwoStallRange.removeEventListener("change", _onMotorTwoStallChanged);
            }

            // stop updating
            window.cancelAnimationFrame(_gameloop);
        }
        return self;
    }

    function _onMotorOneStallChanged(event) {
        _state.setValue("motorOneStall", parseFloat(event.target.value));
    }
    function _onMotorTwoStallChanged(event) {
        _state.setValue("motorTwoStall", parseFloat(event.target.value));
    }

    //
    // view visibility
    //
    let showing = 0;

    function isViewShowing() {
        return showing > 0;
    }

    function showView() {
        showing += 1;
        if (1 === showing) {
            show(container);
        }
        return self;
    }

    function hideView() {
        showing -= 1;
        if (0 === showing) {
            hide(container);
        }
        return self;
    }

    //
    // render/update view
    //
    function updateView(force = false) {
        _enforceView(force);
        return self;
    }

    function _enforceView(force = false) {
        _enforceText(motorOneStallText, "motorOneStall", force);
        _enforceRange(motorOneStallRange, "motorOneStall", force);

        _enforceText(motorTwoStallText, "motorTwoStall", force);
        _enforceRange(motorTwoStallRange, "motorTwoStall", force);
    }


    function _enforceText(element, key, force = false) {
        //
        // enforce the select menu's value
        //
        if (force || _state.isStaged(key)) {
            if (element) {
                element.textContent = _state.commitValue(key);
                return true;
            }
        }

        return false;
    }

    function _enforceRange(element, key, force = false) {
        if(force || _state.isStaged(key)) {
            if(element) {
                element.value = _state.commitValue(key);
                return true;
            }
        }
        return false;
    }

    function _gameloop(timeStamp) {
        updateView();

        if (_listening) {
            window.requestAnimationFrame(_gameloop);
        }
    }

    const self = {
        "getMotorOneStall": getMotorOneStall,
        "getMotorTwoStall": getMotorTwoStall,
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
    }

    return self;
}