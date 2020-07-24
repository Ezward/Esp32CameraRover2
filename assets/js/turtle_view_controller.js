// import TurtleCommand from './turtle_command.js'
// import MessageBus from './message_bus.js'

///////////////// Rover Command View Controller ////////////////////
function TurtleViewController(turtleCommander, setSpeedPercent, cssRoverButton, cssRoverSpeedInput, messageBus = null) {
    const self = this;
    let speedPercent = 0;

    function turtleButtons() {
        return document.querySelectorAll(cssRoverButton);
    }

    function roverSpeedInput() {
        return document.querySelector(cssRoverSpeedInput);
    }

    //
    // reset rover command button text
    //
    function resetRoverButtons() {
        turtleButtons().forEach(butt => {
            // reset button text based on button id
            butt.innerHTML = butt.id.charAt(0).toUpperCase() + butt.id.slice(1);
            butt.classList.remove("disabled");
            butt.disabled = false;
        })
    }

    function stopRoverButton(buttonId) {
        turtleButtons().forEach(butt => {
            // reset button text based on button id
            if (buttonId === butt.id) {
                butt.innerHTML = "Stop";
                butt.classList.remove("disabled");
                butt.disabled = false;
            } else {
                butt.innerHTML = butt.id.charAt(0).toUpperCase() + butt.id.slice(1);
                butt.classList.add("disabled");
                butt.disabled = true;
            }
        })
    }

    //
    // attach rover command buttons
    //
    function onButtonClick(event) {
        const el = event.target;
        if ("Stop" == el.innerHTML) {
            resetRoverButtons(); // button reverts to command
            turtleCommander.roverPostCommand("stop", 0); // run stop command
        } else {
            stopRoverButton(el.id); // button becomes stop button
            turtleCommander.roverPostCommand(el.id, speedPercent); // run button command
        }
    };

    function onSpeedChange(event) {
        speedPercent = constrain(parseInt(event.target.value), 0, 100);
        if (typeof setSpeedPercent === "function") {
            setSpeedPercent(speedPercent); // tell keyboard system about speed
        }
        console.log(`speed percent = ${speedPercent}`);
    }

    let listening = false;

    function startListening() {
        listening += 1;
        if (1 === listening) {
            turtleButtons().forEach(el => {
                //
                // toggle between the button command and the stop command
                //
                el.addEventListener("click", onButtonClick);
            });

            const speedInput = roverSpeedInput();
            if (speedInput) {
                speedInput.addEventListener("change", onSpeedChange);
            }
        }
    }

    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            turtleButtons().forEach(el => {
                //
                // toggle between the button command and the stop command
                //
                el.removeEventListener("click", onButtonClick);
            });

            const speedInput = roverSpeedInput();
            if (speedInput) {
                speedInput.removeEventListener("change", onSpeedChange);
            }
        }
    }

    function isListening() {
        return listening > 0;
    }

    const exports = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "resetRoverButtons": resetRoverButtons,
        "stopRoverButton": stopRoverButton,
    }
    return exports;
}
