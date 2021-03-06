// import TurtleCommand from './turtle_command.js'
// import MessageBus from './message_bus.js'
// import constrain from './utilities.js'
// import RollbackState from './rollback_state.js'
// import TURTLE_KEY_DOWN from './turtle_keyboard_controller.js'
// import TURTLE_KEY_UP from './turtle_keyboard_controller.js'
// import ViewStateTools from './view_state_tools.js'

///////////////// Rover Command View Controller ////////////////////
function TurtleViewController(
    roverCommand, 
    messageBus, 
    cssContainer, cssRoverButton, cssRoverSpeedInput) 
{
    const state = RollbackState({
        "speedPercent": 0.9,     // float: 0..1 normalized speed
        "speedPercentLive": 0.9, // float: 0..1 normalized speed live update
        "activeButton": "",      // string: id of active turtle button or empty string if none are active
    });

    let container = undefined;
    let turtleButtonNames = undefined;
    let turtleButtons = undefined;

    const _speedInput = RangeWidgetController(
        state, "speedPercent", "speedPercentLive", 
        1.0, 0.0, 0.01, 2, 
        cssRoverSpeedInput)

    function attachView() {
        if(isViewAttached()) throw new Error("Attempt to rebind the view.");

        container = document.querySelector(cssContainer);
        turtleButtons = Array.from(container.querySelectorAll(cssRoverButton));
        turtleButtonNames = turtleButtons.map(b => b.id.charAt(0).toUpperCase() + b.id.slice(1));
        _speedInput.attachView();
        return self;
    }

    function detachView() {
        if(isViewAttached()) {
            container = undefined;
            turtleButtons = undefined;
            turtleButtonNames = undefined;
            _speedInput.detachView();
        }
        return self;
    }

    function isViewAttached() {
        return !!turtleButtons;
    }

    //////////// update the view //////////////

    /**
     * Update the view based on the state.
     * Generally, this is called with force=false
     * and updates only happen if state has changed.
     * 
     * @param {boolean} force true to force update of controls
     *                        false to update controls based on staged state
     */
    function updateView(force = false) {
        enforceActiveButton(force);
        _speedInput.enforceView(force);
        return self;
    }

    //
    // this is called periodically to update the controls
    // based on the state.
    //
    function updateLoop(timestamp) {
        updateView();

        if(isListening()) {
            window.requestAnimationFrame(updateLoop);
        }
    }

    //
    // reset rover command button text
    //
    function resetRoverButtons() {
        if(isViewAttached()) {
            for(let i = 0; i < turtleButtons.length; i += 1) {
                // reset button text based on button id
                const butt = turtleButtons[i];
                butt.innerHTML = turtleButtonNames[i];
                butt.classList.remove("disabled");
                butt.disabled = false;
            }
        }
        return self;
    }

    //
    // set seleced button to 'stop' state 
    // and disable other buttons
    //
    function stopRoverButton(buttonId) {
        if(isViewAttached()) {
            for(let i = 0; i < turtleButtons.length; i += 1) {
                // reset button text based on button id
                const butt = turtleButtons[i];
                if (buttonId === butt.id) {
                    butt.innerHTML = "Stop";
                    butt.classList.remove("disabled");
                    butt.disabled = false;
                } else {
                    butt.innerHTML = turtleButtonNames[i];
                    butt.classList.add("disabled");
                    butt.disabled = true;
                }
            }
        }
        return self;
    }

    /**
     * Enforce the state of the button controls.
     * 
     * @param {boolean} force true to force update of controls
     *                        false to update controls based on staged state
     */
    function enforceActiveButton(force = false) {
        if(force || state.isStaged("activeButton")) {
            const buttonId = state.commitValue("activeButton");
            if(!buttonId) {
                resetRoverButtons();
            } else {
                stopRoverButton(buttonId);
            }
        }
    }

    /////////////// listen for input ///////////////////
    let listening = 0;

    /**
     * Start listening for input.
     * This should only be called if the view is attached.
     * This can be called more then once, but each call to 
     * startListening() must be balanced with a call to stopListening().
     */
    function startListening() {
        if(!isViewAttached()) throw new Error("Attempt to start listening before view is bound.");

        listening += 1;
        if (1 === listening) {
            if(turtleButtonNames) {
                turtleButtons.forEach(el => {
                    //
                    // toggle between the button command and the stop command
                    //
                    el.addEventListener("click", onButtonClick);
                });
            }

            _speedInput.startListening();

            if(messageBus) {
                messageBus.subscribe(TURTLE_KEY_DOWN, self);
                messageBus.subscribe(TURTLE_KEY_UP, self);
            }
        }

        window.requestAnimationFrame(updateLoop);
        return self;
    }

    /**
     * Start listening for input.
     * This should only be called if the view is attached.
     * This can be called more then once, but each call to 
     * stopListening() must balance with a call to startListening().
     */
    function stopListening() {
        if(!isViewAttached()) throw new Error("Attempt to stop listening to unbound view.");

        listening -= 1;
        if (0 === listening) {
            if(turtleButtons) {
                turtleButtons.forEach(el => {
                    //
                    // toggle between the button command and the stop command
                    //
                    el.removeEventListener("click", onButtonClick);
                });
            }

            _speedInput.stopListening();

            if(messageBus) {
                messageBus.unsubscribeAll(self);
            }

            window.cancelAnimationFrame(updateLoop);
        }
        return self;
    }

    function isListening() {
        return listening > 0;
    }

    function onMessage(message, data) {
        switch (message) {
            case TURTLE_KEY_DOWN: {
                onButtonSelected(data);
                return;
            }
            case TURTLE_KEY_UP: {
                onButtonUnselected(data);
                return;
            }
            default: {
                console.log("Unhandled message in TurtleViewController");
            }
        }
    }


    //
    // attach rover command buttons
    //
    function onButtonClick(event) {
        const buttonId = event.target.id;
        if (buttonId === state.getValue("activeButton")) {
            onButtonUnselected(buttonId);
        } else {
            onButtonSelected(buttonId);
        }
    };
    function onButtonSelected(buttonId) {
        //
        // if it is the active button,  
        // then revert the button and send 'stop' command
        // if it is not the active button, 
        // then make it active and send it's command
        //
        state.setValue("activeButton", buttonId);
        roverCommand.enqueueTurtleCommand(buttonId, int(100 * state.getValue("speedPercent"))); // run button command
    };
    function onButtonUnselected(buttonId) {
        state.setValue("activeButton", "");
        roverCommand.enqueueTurtleCommand("stop", 0); // run stop command
    }

    const self = {
        "attachView": attachView,
        "detachView": detachView,
        "isViewAttached": isViewAttached,
        "updateView": updateView,
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "resetRoverButtons": resetRoverButtons,
        "stopRoverButton": stopRoverButton,
        "onMessage": onMessage,
    }
    return self;
}
