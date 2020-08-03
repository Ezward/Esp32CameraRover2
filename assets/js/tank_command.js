

///////////// Tank Command ////////////////
function TankCommand(commandSocket, gamepadViewController) {
    let running = false;
    let lastCommand = "";


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

    const _timeSpanPerFrame = 90;  // about 10 fps
    let _lastTimeStamp = 0;
    function _gameloop(timeStamp) {
        if (running) {
            // frame rate limit so we don't overload the ESP32 with requests
            const timeSpan = timeStamp - _lastTimeStamp;
            if(timeSpan >= _timeSpanPerFrame) {
                _lastTimeStamp = timeStamp;
                if(gamepadViewController) {
                    const leftValue = gamepadViewController.getAxisOneValue();
                    const rightValue = gamepadViewController.getAxisTwoValue();
                    const tankCommand = `tank(${int(abs(leftValue) * 255)}, ${leftValue >= 0}, ${int(abs(rightValue) * 255)}, ${rightValue >= 0})`
                    
                    //
                    // if this is a new command then send it
                    //
                    if(tankCommand !== lastCommand) {
                        if(commandSocket && commandSocket.isReady()) {
                            if(commandSocket.sendCommand(tankCommand)) {
                                lastCommand = tankCommand;
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