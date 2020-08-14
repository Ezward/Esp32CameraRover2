// import TurtleCommand from './turtle_command.js'
// import MessageBus from './message_bus.js'
// import TURTLE_SPEED_CHANGE from './turtle_view_controller.js'

//////////// ROVER TURTLE KEYBOARD INPUT /////////////
const TURTLE_KEY_DOWN = "TURTLE_KEY_DOWN";
const TURTLE_KEY_UP = "TURTLE_KEY_UP";

function TurtleKeyboardController(roverCommand, messageBus = null) {
    let listening = 0;
    let speedPercent = 100;

    function setSpeedPercent(percent) {
        speedPercent = constrain(percent, 0, 100);
    }

    function startListening() {
        listening += 1;
        if (1 === listening) {
            document.body.addEventListener("keydown", handleRoverKeyDown);
            document.body.addEventListener("keyup", handleRoverKeyUp);
            messageBus.subscribe(TURTLE_SPEED_CHANGE, self);
        }
    }

    function stopListening() {
        listening -= 1;
        if (0 === listening) {
            document.body.addEventListener("keydown", handleRoverKeyDown);
            document.body.addEventListener("keyup", handleRoverKeyUp);
            messageBus.unsubscribeAll(self);
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
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "forward");
            }
        } else if (e.keyCode == '40') {
            // down arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "reverse");
            }
        } else if (e.keyCode == '37') {
            // left arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "left");
            }
        } else if (e.keyCode == '39') {
            // right arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_DOWN, "right");
            }
        }
    }

    function handleRoverKeyUp(e) {
        e = e || window.event;

        if (e.keyCode == '38') {
            // up arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "forward");
            }
        } else if (e.keyCode == '40') {
            // down arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "reverse");
            }
        } else if (e.keyCode == '37') {
            // left arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "left");
            }
        } else if (e.keyCode == '39') {
            // right arrow
            event.preventDefault();
            if(messageBus) {
                messageBus.publish(TURTLE_KEY_UP, "right");
            }
        }
    }

    function onMessage(message, data) {
        switch (message) {
            case TURTLE_SPEED_CHANGE: {
                setSpeedPercent(data);
                return;
            }
            default: {
                console.log("Unhandled message in TurtleViewController");
            }
        }
    }


    const self = {
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "onMessage": onMessage,
    }

    return self;
}
