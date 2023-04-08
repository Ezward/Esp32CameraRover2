/// <reference path="config.js" />
/// <reference path="dom_utilities.js" />
/// <reference path="message_bus.js" />
/// <reference path="rollback_state.js" />
/// <reference path="canvas_view_controller.js" />
/// <reference path="speed_view_controller.js" />


//
// TODO: implement a rover reset command that restarts encoder and pose from zero.
//


///////////////// main //////////////////
document.addEventListener('DOMContentLoaded', function (event) {
    var baseHost = document.location.origin

    /**
     * update the element's value
     * and optionally send the change
     * to the server (default is true)
     * 
     * @param {Element} el 
     * @param {any} value 
     * @param {boolean | null} updateRemote 
     */
    const updateValue = (el, value, updateRemote) => {
        updateRemote = updateRemote == null ? true : updateRemote
        let initialValue
        if ((el instanceof HTMLInputElement) && (el.type === 'checkbox')) {
            initialValue = el.checked
            value = !!value
            el.checked = value
        } else {
            initialValue = get_value(el)
            set_value(el, value)
        }

        if (updateRemote && initialValue !== value) {
            updateConfig(el);
        } else if (!updateRemote) {
            if (el.id === "aec") {
                value ? hide(exposure) : show(exposure)
            } else if (el.id === "agc") {
                if (value) {
                    show(gainCeiling)
                    hide(agcGain)
                } else {
                    hide(gainCeiling)
                    show(agcGain)
                }
            } else if (el.id === "awb_gain") {
                value ? show(wb) : hide(wb)
            }
        }
    }

    /**
     * update the element's corresponding config on the remote server
     * using a fetch request.
     * 
     * @param {Element} el 
     */
    function updateConfig(el) {
        let value = undefined
        if (el instanceof HTMLInputElement) {
            switch (el.type) {
                case 'checkbox':
                    value = el.checked ? 1 : 0
                    break
                case 'range':
                case 'select-one':
                    value = el.value
                    break
                case 'button':
                case 'submit':
                    value = '1'
                    break
            }
        } else if (el instanceof HTMLSelectElement) {
            if (el.type == 'select-one') {
                value = el.value;
            }
        }

        if (value != undefined) {
            const query = `${baseHost}/control?var=${el.id}&val=${value}`

            fetch(query)
                .then(response => {
                    console.log(`request to ${query} finished, status: ${response.status}`)
                })
        }
    }

    //
    // Add a handler to all close buttons
    // which 'closes' the parent element 
    // when clicked.
    //
    document
        .querySelectorAll('.close')
        .forEach(el => {
            if (el instanceof HTMLElement) {
                el.onclick = () => {
                    hide(el.parentElement)
                }
            }
        })

    // 
    // call the /status endpoint to read all 
    // initial camera values as json
    // and update each value locally.
    // Delay 2 seconds to give camera time to start.
    //
    setTimeout(() => {
        fetch(`${baseHost}/status`)
            .then(function (response) {
                return response.json()
            })
            .then(function (state) {
                for (const [key, value] of Object.entries(state)) {
                    console.log(`${key}: ${value}`);
                    if("enabled" === key) {
                        // hide or show camera controls
                        const doHideShow = value ? show : hide
                        document
                            .querySelectorAll('.camera-ui')
                            .forEach(el => {
                                doHideShow(el)
                            })
                    } else {
                        let el = document.querySelector(`#${key}.default-action`);
                        if(el) {
                            updateValue(el, value, false);
                        }
                    }
                }
                  
                // document
                //     .querySelectorAll('.default-action')
                //     .forEach(el => {
                //         if(state.hasOwnProperty(el.id)) {
                //             updateValue(el, state[el.id], false)
                //         }
                //     })
            })
    }, 2000);

    const view = document.getElementById('stream')
    const viewContainer = document.getElementById('stream-container')
    const stillButton = document.getElementById('get-still')
    const streamButton = document.getElementById('toggle-stream')
    const closeButton = document.getElementById('close-stream')

    //
    // create instances of the control modules
    //
    /** @type {MessageBusType} */
    const messageBus = MessageBus();

    const streamingSocket = StreamingSocket(location.hostname, 81, view);
    const commandSocket = CommandSocket(location.hostname, 82, messageBus);
    const roverCommand = RoverCommand(baseHost, commandSocket);

    const joystickContainer = document.getElementById("joystick-control");
    const joystickViewController = GamePadViewController(joystickContainer, 
        "#joystick-control > .selector > .select-gamepad ",                                                                     // gamepad select element
        "#joystick-control > .selector > .axis-one", "#joystick-control > .selector > .axis-two",                                   // axis select element
        "#joystick-control > .axis-one-value > .control-value", "#joystick-control > .axis-two-value > .control-value",             // axis value element
        "#joystick-control > .axis-one-zero",   // axis zero range widget
        "#joystick-control > .axis-two-zero",   // axis zero range widget
        "#joystick-control > .axis-one-flip > .switch > input[type=checkbox]", "#joystick-control > .axis-two-flip > .switch > input[type=checkbox]",   // axis flip checkbox element
        messageBus);

    const tankContainer = document.getElementById("tank-control");
    const tankViewController = GamePadViewController(tankContainer, 
        "#tank-control > .selector > .select-gamepad ",                                                                     // gamepad select element
        "#tank-control > .selector > .axis-one", "#tank-control > .selector > .axis-two",                                   // axis select element
        "#tank-control > .axis-one-value > .control-value", "#tank-control > .axis-two-value > .control-value",             // axis value element
        "#tank-control > .axis-one-zero", "#tank-control > .axis-two-zero",         
        "#tank-control > .axis-one-flip > .switch > input[type=checkbox]", "#tank-control > .axis-two-flip > .switch > input[type=checkbox]",   // axis flip checkbox element
        messageBus);

    const gotoGoalViewController = GotoGoalViewController(
        roverCommand, 
        "#goto-goal-control", 
        "#goto_goal_x", 
        "#goto_goal_y", 
        "#goto_goal_tolerance", 
        "#point-forward-group",
        "#goto_goal_start",
        "#goto_goal_cancel",
        messageBus);

    const motorViewController = MotorViewController( 
        roverCommand,
        "#motor-values",
        "#motor-values .motor-one-stall",
        "#motor-values .motor-two-stall",
    );

    const speedViewController = SpeedViewController(
        roverCommand,
        "#pid-values",
        "#use_speed_control",
        ["#min_speed_0", "#min_speed_1"],
        ["#max_speed_0", "#max_speed_1"],
        ["#proportional_gain_0", "#proportional_gain_1"],
        ["#integral_gain_0", "#integral_gain_1"],
        ["#derivative_gain_0", "#derivative_gain_1"],
    );

    //
    // realtime rover telemetry plotter
    //
    const leftTelemetryListener = TelemetryListener(messageBus, "telemetry", "left", config.telemetryBufferSize());
    const rightTelemetryListener = TelemetryListener(messageBus, "telemetry", "right", config.telemetryBufferSize());
    const telemetryViewController = CanvasViewController(
        "#motor-telemetry", 
        "canvas", 
        TelemetryCanvasPainter(leftTelemetryListener, rightTelemetryListener, SpeedControlModel),
        messageBus,
        "telemetry-update");
    const resetTelemetryViewController = ResetTelemetryViewController(
        undefined, 
        [leftTelemetryListener, rightTelemetryListener], 
        "#motor-telemetry-container .okcancel-container", 
        "#reset-telemetry");
    
    const poseTelemetryListener = TelemetryListener(messageBus, "pose", "pose", config.poseTelemetrySize());
    const poseTelemetryViewController = CanvasViewController(
        "#pose-telemetry", 
        "canvas", 
        PoseCanvasPainter(poseTelemetryListener),
        messageBus,
        "pose-update");
    const resetPoseViewController = ResetTelemetryViewController(
        roverCommand.sendResetPoseCommand, 
        [poseTelemetryListener], 
        "#pose-telemetry-container .okcancel-container", 
        "#reset-pose");

    const telemetryTabController = TabViewController("#rover-telemetry-tabs", ".tablinks", messageBus);
    const telemetryViewManager = TelemetryViewManager(
        messageBus, 
        telemetryViewController,
        resetTelemetryViewController, 
        poseTelemetryViewController, 
        resetPoseViewController);

    const turtleKeyboardControl = TurtleKeyboardController(messageBus);
    const turtleViewController = TurtleViewController(roverCommand, messageBus, '#turtle-control', 'button.rover', '#rover_speed-group');
    
    const roverViewManager = RoverViewManager(
        roverCommand, 
        messageBus, 
        turtleViewController, 
        turtleKeyboardControl, 
        tankViewController, 
        joystickViewController, 
        gotoGoalViewController);
    const roverTabController = TabViewController("#rover-control", ".tablinks", messageBus);

    const configTabController = TabViewController("#configuration-tabs", ".tablinks", messageBus);

    const gotoGoalModelListener = TelemetryModelListener(messageBus, "goto", "goto", GotoGoalModel);
    
    //
    // start the turtle rover control system
    //
    commandSocket.start();  // start socket for sending commands
    roverCommand.start();   // start processing rover commands

    // start listening for input
    turtleViewController.attachView().updateView(true).startListening();
    turtleKeyboardControl.startListening();
    tankViewController.attachView();
    joystickViewController.attachView();
    roverTabController.attachView().startListening();
    roverViewManager.startListening();
    motorViewController.attachView().updateView(true).showView().startListening();
    speedViewController.bindModel(SpeedControlModel).attachView().updateView(true).hideView().startListening();
    configTabController.attachView().startListening();
    leftTelemetryListener.startListening();
    rightTelemetryListener.startListening();
    telemetryViewController.attachView().updateView(true).showView().startListening();
    poseTelemetryViewController.attachView().updateView(true).showView().startListening();
    resetPoseViewController.attachView().showView().startListening();
    resetTelemetryViewController.attachView().showView().startListening();
    telemetryTabController.attachView().startListening();
    telemetryViewManager.startListening();
    poseTelemetryListener.startListening();
    gotoGoalModelListener.startListening();
    gotoGoalViewController.bindModel(GotoGoalModel).attachView().updateView(true);

    const stopStream = () => {
        streamingSocket.stop();
        view.onload = null;
        streamButton.innerHTML = 'Start Stream'
    }

    let startTimestamp = 0;
    let frameCount = 0;
    const startStream = () => {
        // websocket listener will start showing frames
        streamingSocket.start();
        show(viewContainer)
        streamButton.innerHTML = 'Stop Stream'
    }

    // Attach actions to buttons
    stillButton.onclick = () => {
        stopStream()
        view.src = `${baseHost}/capture?_cb=${Date.now()}`
        show(viewContainer)
    }

    closeButton.onclick = () => {
        stopStream()
        hide(viewContainer)
    }

    streamButton.onclick = () => {
        const streamEnabled = streamButton.innerHTML === 'Stop Stream'
        if (streamEnabled) {
            stopStream()
        } else {
            startStream()
        }
    }


    //
    // make sure select and range controls don't
    // respond to keyboard keys because
    // it conflicts with the rover control
    //
    document.querySelectorAll('input[type=range]').forEach(el => {
        el.onkeydown = (event) => {
            event.preventDefault()
        }
    });
    document.querySelectorAll('select').forEach(el => {
        el.onkeydown = (event) => {
            event.preventDefault()
        }
    });

    // Attach default on change action
    document
        .querySelectorAll('.default-action')
        .forEach(el => {
            el.onchange = () => updateConfig(el)
        })

    // Custom actions
    // Gain
    const agc = document.getElementById('agc')
    const agcGain = document.getElementById('agc_gain-group')
    const gainCeiling = document.getElementById('gainceiling-group')
    agc.onchange = () => {
        updateConfig(agc)
        if (agc.checked) {
            show(gainCeiling)
            hide(agcGain)
        } else {
            hide(gainCeiling)
            show(agcGain)
        }
    }

    // Exposure
    const aec = document.getElementById('aec')
    const exposure = document.getElementById('aec_value-group')
    aec.onchange = () => {
        updateConfig(aec)
        aec.checked ? hide(exposure) : show(exposure)
    }

    // AWB
    const awb = document.getElementById('awb_gain')
    const wb = document.getElementById('wb_mode-group')
    awb.onchange = () => {
        updateConfig(awb)
        awb.checked ? show(wb) : hide(wb)
    }

    const framesize = document.getElementById('framesize')

    framesize.onchange = () => {
        updateConfig(framesize)
    }
})
