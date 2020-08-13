

///////////////// ROVER HTTP COMMAND API ////////////////////
function TurtleCommand(host) {
    let roverSending = false;
    let roverDirection = "stop";
    let roverSpeed = 0;

    //
    // append a command to the command queue
    //
    let commands = [];
    let speeds = [];

    function roverPostCommand(command, speedPercent) {
        //
        // don't add redundant commands
        //
        if ((0 === commands.length) || (command !== commands[commands.length - 1])) {
            commands.push(command); // add to end of command buffer
            speeds.push(0 | ((speedPercent * 255) / 100)); // convert to int 0..255
        } else {
            // command is already queued, no need for a second one
            console.log(`command ${command} not pushed: ${command} is already buffered.`);
        }
        roverSendCommand(); // send next command in command queue
    }


    // 
    // send the next command in the command queue
    //
    function roverSendCommand() {
        if (0 === commands.length) {
            return; // nothing to do
        }
        if (roverSending) {
            return; // already busy, leave command buffered
        }
        let command = commands[0];
        let speed = speeds[0];
        if (roverDirection === command) {
            commands.shift(); // remove the redundant command
            speeds.shift();
            console.log(`command ${command} ignored: rover already is ${command}.`);
            return;
        }

        roverSendCommandImmediate(command, speed);
    }

    function roverSendCommandImmediate(command, speed) {
        console.log(`sending ${command}, speed ${speed}`);
        roverSending = command;
        let url = `${host}/rover?direction=${command}&speed=${speed}`;
        fetch(url).then((response) => {
            if (200 == response.status) {
                console.log(`${command} fulfilled`);

                // remove command from buffer and make sure we sent the right one
                const sentCommand = commands.shift();
                const sentSpeed = speeds.shift();
                console.assert("The executed command should be at the start of the buffer.", command === sentCommand);
                console.assert("The executed speed should be at the start of the buffer.", speed === sentSpeed);

                // this is what we are doing folks
                roverDirection = command;
                roverSpeed = speed;
            } else {
                console.log(`${command} rejected: ${response.statusText}`);
                stop();
            }
        }, (reason) => {
            console.log(`${command} failed: ${reason}`);
            stop();
        }).catch((reason) => {
            console.log(`${command} exception: ${reason}`);
            stop();
        }).finally((info) => {
            console.log(`done sending command ${command}`);
            roverSending = null
        })
    }


    let running = false;

    function roverLoop(timestamp) {
        if (running) {
            roverSendCommand();
            window.requestAnimationFrame(roverLoop);
        }
    }

    function start() {
        running = true;
        window.requestAnimationFrame(roverLoop);
    }

    function stop() {
        if (running) {
            running = false;
            commands = [];
            speeds = [];
            window.cancelAnimationFrame(roverLoop);
            roverSendCommandImmediate("stop", 0);
        }
    }

    const exports = {
        "start": start,
        "stop": stop,
        "roverPostCommand": roverPostCommand,
    }

    return exports;
}
