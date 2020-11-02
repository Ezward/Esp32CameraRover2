// import RollbackState from "./rollback_state.js"
// import int from "./utilities.js"
// import (_enforceText, _enforceRange) from "./view_state_tools.js"
// import RoverCommand from "./rover_command.js"

function MotorViewController(
    roverCommand, 
    cssContainer, 
    cssMotorOneStall, cssMotorTwoStall, 
    cssMotorOneStallText, cssMotorTwoStallText) 
{
    let _syncValues = false;   // true to send the stall values to the rover
    let _lastSyncMs = 0;       // millis of last time we synced values

    //
    // view state
    //
    const _state = RollbackState({
        motorOneStall: 0,     // float: fraction of full throttle below which engine stalls
        motorTwoStall: 0,     // float: fraction of full throttle below which engine stalls
        motorOneStallLive: 0, // float: live update of motorOneStall
        motorTwoStallLive: 0, // float: live update of motorTwoStall
    });

    //
    // view dom attachment
    //
    let container = undefined;
    let motorOneStallRange = undefined;
    let motorTwoStallRange = undefined;
    let motorOneStallText = undefined;
    let motorTwoStallText = undefined;

    function isViewAttached() {
        return !!motorOneStallRange;
    }

    function attachView() {
        if (!isViewAttached()) {
            container = document.querySelector(cssContainer);
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
            container = undefined;
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

    function startListening(roverCommand) {
        _listening += 1;
        if (1 === _listening) {
            // listen for changes to list of gamepads
            if (motorOneStallRange) {
                motorOneStallRange.addEventListener("change", _onMotorOneStallChanged);
                motorOneStallRange.addEventListener("input", _onMotorOneStallLiveUpdate);
            }
            if (motorTwoStallRange) {
                motorTwoStallRange.addEventListener("change", _onMotorTwoStallChanged);
                motorTwoStallRange.addEventListener("input", _onMotorTwoStallLiveUpdate);
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
                motorOneStallRange.removeEventListener("input", _onMotorOneStallLiveUpdate);
            }
            if (motorTwoStallRange) {
                motorTwoStallRange.removeEventListener("change", _onMotorTwoStallChanged);
                motorTwoStallRange.removeEventListener("input", _onMotorTwoStallLiveUpdate);
            }

            // stop updating
            window.cancelAnimationFrame(_gameloop);
        }
        return self;
    }

    function _onMotorOneStallChanged(event) {
        const value = parseFloat(event.target.value);
        _state.setValue("motorOneStall", value);
        _state.setValue("motorOneStallLive", value);
    }
    function _onMotorTwoStallChanged(event) {
        const value = parseFloat(event.target.value);
        _state.setValue("motorTwoStall", value);
        _state.setValue("motorTwoStallLive", value);
    }
    function _onMotorOneStallLiveUpdate(event) {
        _state.setValue("motorOneStallLive", parseFloat(event.target.value));
    }
    function _onMotorTwoStallLiveUpdate(event) {
        _state.setValue("motorTwoStallLive", parseFloat(event.target.value));
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
        _enforceText(motorOneStallText, "motorOneStallLive", force);
        _syncValues = _enforceRange(motorOneStallRange, "motorOneStall", force) || _syncValues;

        _enforceText(motorTwoStallText, "motorTwoStallLive", force);
        _syncValues = _enforceRange(motorTwoStallRange, "motorTwoStall", force) || _syncValues;
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

    function _isMotorStallValid(value) {
        return (typeof value == "number") && (value >= 0) && (value <= 1);
    }

    function _syncMotorStall() {
        if(_syncValues) {
            if(roverCommand) {
                // rate limit to once per second
                const now = new Date();
                if(now.getTime() >= (_lastSyncMs + 1000)) {
                    const motorOneStall = _state.getValue("motorOneStall");
                    const motorTwoStall = _state.getValue("motorTwoStall");
                    if(_isMotorStallValid(motorOneStall) && _isMotorStallValid(motorTwoStall)) {
                        roverCommand.syncMotorStall(motorOneStall, motorTwoStall);

                        _syncValues = false;
                        _lastSyncMs = now.getTime();
                    }
                }
            }
        }
    }

    /**
     * Periodically update view and sync values to rover.
     * 
     * @param {*} timeStamp 
     */
    function _gameloop(timeStamp) {
        updateView();
        _syncMotorStall();

        if (_listening) {
            window.requestAnimationFrame(_gameloop);
        }
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
    }

    return self;
}