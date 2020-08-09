

///////////// Tank Command ////////////////
function TankCommand(commandSocket, gamepadViewController, motorViewController) {
    let running = false;
    let lastCommand = "";
    let commandCount = 0;


    function isRunning() {
        return running;
    }

    function start() {
        if(!running) {
            running = true;

            // start the command loop
            _gameloop(performance.now());
        }
    }

    function stop() {
        if(running) {
            running = false;
            window.cancelAnimationFrame(_gameloop);
        }
    }

    function abs(x) {
        if("number" !== typeof x) throw new TypeError();
        return (x >= 0) ? x : -x;
    }
    function int(x) {
        if("number" !== typeof x) throw new TypeError();
        return x | 0;
    }

    let _nextFrame = 0;
    function _gameloop(timeStamp) {
        if (running) {
            // frame rate limit so we don't overload the ESP32 with requests
            if(timeStamp >= _nextFrame) {
                _nextFrame = timeStamp + 90;    // about 10 frames per second
                if(gamepadViewController) {
                    let leftValue = gamepadViewController.getAxisOneValue();
                    let rightValue = gamepadViewController.getAxisTwoValue();


                    // apply flip
                    if(gamepadViewController.getAxisOneFlip()) {
                        leftValue = -(leftValue);
                    }
                    if(gamepadViewController.getAxisTwoFlip()) {
                        rightValue = -(rightValue);
                    }

                    // apply stall value, so joystick controlls from stall value to full throttle
                    const leftStallValue = int(motorViewController.getMotorOneStall() * 255);
                    const leftCommandRange = 255 - leftStallValue;
                    let leftCommandValue = leftStallValue + abs(leftValue) * leftCommandRange;
                    const rightStallValue = int(motorViewController.getMotorTwoStall() * 255)
                    const rightCommandRange = 255 - rightStallValue;
                    let rightCommandValue = rightStallValue + abs(rightValue) * rightCommandRange;

                    // apply zero area (axis zone near zero that we treat as zero)
                    if(abs(leftValue) <= gamepadViewController.getAxisOneZero()) {
                        leftCommandValue = 0;
                    }
                    if(abs(rightValue) <= gamepadViewController.getAxisTwoZero()) {
                        rightCommandValue = 0;
                    }
                    

                    // format command
                    const tankCommand = `tank(${int(leftCommandValue)}, ${leftValue >= 0}, ${int(rightCommandValue)}, ${rightValue >= 0})`
                    
                    //
                    // if this is a new command then send it
                    //
                    if(tankCommand !== lastCommand) {
                        if(commandSocket && commandSocket.isReady() && !commandSocket.isSending()) {
                            const commandWrapper = `cmd(${commandCount}, ${tankCommand})`
                            if(commandSocket.sendCommand(commandWrapper)) {
                                lastCommand = tankCommand;
                                commandCount += 1;
                            }
                        }
                    }
                }
            }
            window.requestAnimationFrame(_gameloop);
        }
    }

    const exports = {
        "start": start,
        "stop": stop,
        "isRunning": isRunning,
    }

    return exports;
}