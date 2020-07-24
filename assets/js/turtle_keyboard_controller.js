// import TurtleCommand from './turtle_command.js'
// import MessageBus from './message_bus.js'

//////////// ROVER TURTLE KEYBOARD INPUT /////////////
function TurtleKeyboardController(turtleCommander, messageBus = null) {
    let listening = 0;
    let speedPercent = 100;
    let turtleViewController = undefined;

    // inject view controller dependency
    function setViewController(viewController) {
        turtleViewController = viewController;
    }

    function setSpeedPercent(percent) {
        speedPercent = constrain(percent, 0, 100);
    }

    function startListening() {
        listening += 1;
        if (1 === listening) {
            document.body.addEventListener("keydown", handleRoverKeyDown);
            document.body.addEventListener("keyup", handleRoverKeyUp);
        }
    }

    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            document.body.addEventListener("keydown", handleRoverKeyDown);
            document.body.addEventListener("keyup", handleRoverKeyUp);
        }
    }

    function isListening() {
        return listening > 0;
    }

    function handleRoverKeyDown(e) {
        e = e || window.event;

        if (e.keyCode == '38') {
            // up arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("forward", speedPercent);
            if (turtleViewController) {
                turtleViewController.stopRoverButton("forward"); // button becomes stop button
            }
        } else if (e.keyCode == '40') {
            // down arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("reverse", speedPercent);
            if (turtleViewController) {
                turtleViewController.stopRoverButton("reverse"); // button becomes stop button
            }
        } else if (e.keyCode == '37') {
            // left arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("left", speedPercent);
            if (turtleViewController) {
                turtleViewController.stopRoverButton("left"); // button becomes stop button
            }
        } else if (e.keyCode == '39') {
            // right arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("right", speedPercent);
            if (turtleViewController) {
                turtleViewController.stopRoverButton("right"); // button becomes stop button
            }
        }
    }

    function handleRoverKeyUp(e) {
        e = e || window.event;

        if (e.keyCode == '38') {
            // up arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("stop", 0)
            if (turtleViewController) {
                turtleViewController.resetRoverButtons(); // button reverts to command
            }
        } else if (e.keyCode == '40') {
            // down arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("stop", 0)
            if (turtleViewController) {
                turtleViewController.resetRoverButtons(); // button reverts to command
            }
        } else if (e.keyCode == '37') {
            // left arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("stop", 0)
            if (turtleViewController) {
                turtleViewController.resetRoverButtons(); // button reverts to command
            }
        } else if (e.keyCode == '39') {
            // right arrow
            event.preventDefault();
            turtleCommander.roverPostCommand("stop", 0)
            if (turtleViewController) {
                turtleViewController.resetRoverButtons(); // button reverts to command
            }
        }
    }

    const exports = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "setSpeedPercent": setSpeedPercent,
        "setViewController": setViewController,
    }

    return exports;
}
