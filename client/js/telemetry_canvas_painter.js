
/**
 * Construct canvas painter that draw telemetry line charts.
 * 
 * @param {*} messageBus 
 * @param {*} leftTelemetry 
 * @param {*} rightTelemetry 
 */
function TelemetryCanvasPainter(leftTelemetry, rightTelemetry) {
    const pwmAxis = Axis();
    const speedAxis = Axis();
    const timeAxis = Axis();
    const lineChart = LineChart();
    let _canvas = undefined;
    const _left = 20;
    const _right = 20;
    const _top = 10;
    const _bottom = 20;
    const _backgroundColor = "gainsboro";

    function isCanvasAttached() {
        return !!_canvas;
    }

    /**
     * Bind to a canvas context
     * 
     * @param {*} canvas   - // IN : canvas with 2DContext 
     * @returns {LineChart} - // RET: this LineChart instance
     */
    function attachCanvas(canvas) {
        _canvas = canvas;

        return self;
    }

    function detachCanvas() {
        _canvas = null;

        return self;
    }

    /**
     * Convert (forward, pwm) value from telemetry into a signed pwm value.
     * 
     * @param {*} value 
     */
    function signedPwm(value) {
        return value.forward ? value.pwm : -value.pwm;
    }

    /**
     * Construct iterator that returns (pwm, time) pairs.
     * 
     * @param {*} telemetry 
     */
    function PwmIterator(telemetry) {
        let i = 0;
        function hasNext() {
            return i < telemetry.count();
        }
        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: signedPwm(value),
                };
            }
            throw RangeError("PwmIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    /**
     * Construct iterator that produces (speed, time) pairs
     * 
     * @param {*} telemetry 
     */
    function SpeedIterator(telemetry) {
        let i = 0;

        function hasNext() {
            return i < telemetry.count();
        }

        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: value.speed,
                };
            }
            throw RangeError("SpeedIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    /**
     * Construct iterator that produces (time, targetSpeed) pairs.
     * 
     * @param {*} telemetry 
     */
    function TargetSpeedIterator(telemetry) {
        let i = 0;
        function hasNext() {
            return i < telemetry.count();
        }
        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.at,    // time
                    y: value.target,
                };
            }
            throw RangeError("TargetSpeedIterator is out of range.")
        }

        return {
            "hasNext": hasNext,
            "next": next,
        }
    }

    function paint() {
        if(isCanvasAttached()) {
            let context = _canvas.getContext("2d");

            // clear entire canvas
            context.fillStyle = config.chartBackgroundColor();
            context.fillRect(0, 0, _canvas.width, _canvas.height);

            //
            // area of chart
            //
            const left = _left;
            const right = _canvas.width - _right;
            const top = _top;
            const bottom = _canvas.height - _bottom;
    
            //
            // set axes bounds
            //
            timeAxis.attachContext(context).setChartArea(left, top, right, bottom);
            speedAxis.attachContext(context).setChartArea(left, top, right, bottom);
            pwmAxis.attachContext(context).setChartArea(left, top, right, bottom);
                    
            // 
            // draw axes
            //
            timeAxis.setLineColor(config.chartAxisColor()).drawBottomAxis().drawBottomTicks();
            speedAxis.setLineColor(config.chartAxisColor()).drawLeftAxis().drawLeftTicks();
            pwmAxis.setLineColor(config.chartAxisColor()).drawRightAxis().drawRightTicks();

            if((leftTelemetry.count() > 0) && (rightTelemetry.count() > 0)) {
                // 
                // draw chart
                //
                lineChart.attachContext(context).setChartArea(left, top, right, bottom);

                //
                // Set data range for time axis.
                // The duration is set in config, so choose the appropriate min and max
                //
                const timeSpanMs = config.telemetryPlotMs();
                let minimumTimeMs = max(leftTelemetry.last()["at"], rightTelemetry.last()["at"]) - timeSpanMs
                minimumTimeMs = max(minimumTimeMs, min(leftTelemetry.first()["at"], rightTelemetry.first()["at"]));
                timeAxis.setMin(minimumTimeMs);
                timeAxis.setMax(minimumTimeMs + timeSpanMs);

                // 
                // set speed axis range based on stats kept by telemetry.
                // 
                let minimumSpeed = min(0, leftTelemetry.minimum("speed"));
                minimumSpeed = min(minimumSpeed, rightTelemetry.minimum("speed"));
                minimumSpeed = min(minimumSpeed, leftTelemetry.minimum("target"));
                minimumSpeed = min(minimumSpeed, rightTelemetry.minimum("target"));
                speedAxis.setMin(minimumSpeed);

                let maximumSpeed = max(0, leftTelemetry.maximum("speed"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("speed"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("target"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("target"));
                speedAxis.setMax(maximumSpeed);

                pwmAxis.setMin(-255).setMax(255);

                // draw zero speed
                lineChart.setLineColor(config.chartAxisColor()).drawHorizontal(0, timeAxis, speedAxis, 3, 3);

                // target speed
                lineChart.setLineColor(config.leftTargetColor()).setPointColor(config.leftTargetColor());;
                lineChart.plotLine(TargetSpeedIterator(leftTelemetry), timeAxis, speedAxis);
                lineChart.setLineColor(config.rightTargetColor()).setPointColor(config.rightTargetColor());;
                lineChart.plotLine(TargetSpeedIterator(rightTelemetry), timeAxis, speedAxis);

                // measured speed
                lineChart.setLineColor(config.leftSpeedColor()).setPointColor(config.leftSpeedColor());
                lineChart.plotLine(SpeedIterator(leftTelemetry), timeAxis, speedAxis);
                lineChart.setLineColor(config.rightSpeedColor()).setPointColor(config.rightSpeedColor());
                lineChart.plotLine(SpeedIterator(rightTelemetry), timeAxis, speedAxis);

                // pwm value
                lineChart.setLineColor(config.leftPwmColor()).setPointColor(config.leftPwmColor());
                lineChart.plotLine(PwmIterator(leftTelemetry), timeAxis, pwmAxis);
                lineChart.setLineColor(config.rightPwmColor()).setPointColor(config.rightPwmColor());
                lineChart.plotLine(PwmIterator(rightTelemetry), timeAxis, pwmAxis);

                // done
                lineChart.detachContext();
            }
            
            // done and done
            pwmAxis.detachContext();
            speedAxis.detachContext();
            timeAxis.detachContext();
    
        }
        return self;
    }

    const self = {
        "isCanvasAttached": isCanvasAttached,
        "attachCanvas": attachCanvas,
        "detachCanvas": detachCanvas,
        "paint": paint,
    }

    return self;
}
