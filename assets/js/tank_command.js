

///////////// Tank Command ////////////////
function TankCommand(commandSocket, gamepadViewController) {
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
                    const leftValue = gamepadViewController.getAxisOneValue();
                    const rightValue = gamepadViewController.getAxisTwoValue();
                    const tankCommand = `tank(${int(abs(leftValue) * 255)}, ${leftValue >= 0}, ${int(abs(rightValue) * 255)}, ${rightValue >= 0})`
                    
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