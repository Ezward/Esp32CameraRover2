

function TelemetryViewController(cssTelemetryContainer, cssTelemetryCanvas) {
    let telemetryContainer = undefined;
    let telemetryCanvas = undefined;
    let telemetry = [                   // array of time and motor readings
        {
            timeMs: 1000,               // timestamp; ms from startup
            wheel: [                    // 1 reading for each motor
                {                       // left wheel
                    label: "left",
                    pwm: 255,           // pwm at timeMs
                    speed: 22.3,        // speed at timeMs
                    distance: 1034.5,   // distance travelled at timeMs
                },
                {                       // right wheel
                    label: "right",
                    pwm: 128, 
                    speed: 11.1, 
                    distance: 1034.2
                },
            ]
        },
    ]

    function isViewAttached() {
        return (telemetryContainer && telemetryCanvas);
    }

    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return;
        }

        telemetryContainer = document.querySelector(cssTelemetryContainer);
        if(telemetryContainer) {
            telemetryCanvas = telemetryContainer.querySelector(cssTelemetryCanvas);
        }
        return self;
    }

    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return;
        }

        telemetryContainer = undefined;
        telemetryCanvas = undefined;
        return self;
    }

    function isListening() {
        return false;
    }

    function startListening() {

        return self;
    }

    function stopListening() {

        return self;
    }


    // public api
    const self = {
        isViewAttached: isViewAttached,
        attachView: attachView,
        detachView: detachView,
        isListening: isListening,
        startListening: startListening,
        stopListening: stopListening,
    }

    return self;
}