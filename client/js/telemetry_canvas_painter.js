
/**
 * Construct canvas painter that draw telemetry line charts.
 * 
 * @param {*} messageBus 
 * @param {*} leftTelemetry 
 * @param {*} rightTelemetry 
 */
function TelemetryCanvasPainter(leftTelemetry, rightTelemetry, speedControl) {
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

    /**
     * calculate averate speed for last spanMs milliseconds.
     * 
     * @param {object} telemetry 
     * @param {number} spanMs 
     * @returns {number} - // average speed over last spanMs milliseconds
     *                        or 0 if there is no data.
     */
    function averageSpeed(telemetry, spanMs) {
        if(telemetry.count() > 0) {
            let sum = 0;
            let n = 0;
            const limitMs = telemetry.last().at - spanMs;
            for(let i = telemetry.count() - 1; i >= 0; i -= 1) {
                const data = telemetry.get(i);
                if(data.at >= limitMs) {
                    sum += data.speed;
                    n += 1;
                } else {
                    break;  // rest of data is out of range
                }
            }

            return sum / n;
        }
        return 0;
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
            const borders = ChartUtils.calcBorders(context, timeAxis.tickLength());
            const left = borders.left;
            const right = _canvas.width - borders.right;
            const top = borders.top;
            const bottom = _canvas.height - borders.bottom;
    
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

            //
            // trim all values that are outside the configured time window
            //
            const timeSpanMs = config.telemetryPlotMs();
            if(leftTelemetry.count() > 0) {
                leftTelemetry.trimBefore(leftTelemetry.last()["at"] - timeSpanMs);
            }
            if(rightTelemetry.count() > 0) {
                rightTelemetry.trimBefore(rightTelemetry.last()["at"] - timeSpanMs);
            }

            if((leftTelemetry.count() > 0) && (rightTelemetry.count() > 0)) {
                // 
                // draw chart
                //
                lineChart.attachContext(context).setChartArea(left, top, right, bottom);

                //
                // Set data range for time axis.
                // The duration is set in config, so choose the appropriate min and max
                //
                let minimumTimeMs = min(leftTelemetry.first()["at"], rightTelemetry.first()["at"]);
                timeAxis.setMinimum(minimumTimeMs).setMaximum(minimumTimeMs + timeSpanMs);

                // 
                // set speed axis range based on stats kept by telemetry.
                // 
                let minimumSpeed = min(0, min(speedControl.minimumSpeed("left"), speedControl.minimumSpeed("right")));
                minimumSpeed = min(minimumSpeed, leftTelemetry.minimum("speed"));
                minimumSpeed = min(minimumSpeed, rightTelemetry.minimum("speed"));
                minimumSpeed = min(minimumSpeed, leftTelemetry.minimum("target"));
                minimumSpeed = min(minimumSpeed, rightTelemetry.minimum("target"));

                let maximumSpeed = max(0, max(speedControl.maximumSpeed("left"), speedControl.maximumSpeed("right")));
                maximumSpeed = max(maximumSpeed, leftTelemetry.maximum("speed"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("speed"));
                maximumSpeed = max(maximumSpeed, leftTelemetry.maximum("target"));
                maximumSpeed = max(maximumSpeed, rightTelemetry.maximum("target"));
                speedAxis.setMinimum(minimumSpeed).setMaximum(maximumSpeed);

                // prefer zero for max or min unless range is on either side
                pwmAxis.setMinimum(-255).setMaximum(255);

                // draw zero speed
                lineChart.setLineColor(config.chartAxisColor()).drawHorizontal(0, timeAxis, speedAxis, 3, 3);
                speedAxis.drawLeftText("0", 0);

                // target speed
                lineChart.setLineColor(config.leftTargetColor()).setPointColor(config.leftTargetColor());;
                lineChart.plotLine(TargetSpeedIterator(leftTelemetry), timeAxis, speedAxis);
                lineChart.drawText(
                    averageSpeed(leftTelemetry, config.averageSpeedMs()).toFixed(1), 
                    timeAxis.minimum() + (0.25 * (timeAxis.maximum() - timeAxis.minimum())),
                    speedAxis.minimum() + (0.5 * (speedAxis.maximum() - speedAxis.minimum())),
                    timeAxis, speedAxis);
                lineChart.setLineColor(config.rightTargetColor()).setPointColor(config.rightTargetColor());
                lineChart.plotLine(TargetSpeedIterator(rightTelemetry), timeAxis, speedAxis);
                lineChart.drawText(
                    averageSpeed(rightTelemetry, config.averageSpeedMs()).toFixed(1), 
                    timeAxis.minimum() + (0.75 * (timeAxis.maximum() - timeAxis.minimum())),
                    speedAxis.minimum() + (0.5 * (speedAxis.maximum() - speedAxis.minimum())),
                    timeAxis, speedAxis);

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
            
            speedAxis.drawLeftText(`${speedAxis.minimum().toFixed(1)}`, speedAxis.minimum());
            speedAxis.drawLeftText(`${speedAxis.maximum().toFixed(1)}`, speedAxis.maximum());
            pwmAxis.drawRightText(`${pwmAxis.minimum()}`, pwmAxis.minimum());
            pwmAxis.drawRightText(`${pwmAxis.maximum()}`, pwmAxis.maximum());
            timeAxis.drawBottomText("0", timeAxis.minimum());
            timeAxis.drawBottomText(`${config.telemetryPlotMs() / 1000}`, timeAxis.maximum());

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
