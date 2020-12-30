
/**
 * Construct canvas painter that draw telemetry line charts.
 * 
 * @param {*} poseTelemetry 
 */
function PoseCanvasPainter(poseTelemetry) {
    const xAxis = Axis();
    const yAxis = Axis();
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
     * Construct iterator that returns (x, y) pairs.
     * 
     * @param {*} telemetry 
     */
    function PointIterator(telemetry) {
        let i = 0;
        function hasNext() {
            return i < telemetry.count();
        }
        function next() {
            if(hasNext()) {
                const value = telemetry.get(i);
                i += 1;
                return {
                    x: value.x,    // time
                    y: value.y,
                };
            }
            throw RangeError("PointIterator is out of range.")
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
            const borders = ChartUtils.calcBorders(context, xAxis.tickLength());
            const left = borders.left;
            const right = _canvas.width - borders.right;
            const top = borders.top;
            const bottom = _canvas.height - borders.bottom;
    
            //
            // set axes bounds
            //
            xAxis.attachContext(context).setChartArea(left, top, right, bottom);
            yAxis.attachContext(context).setChartArea(left, top, right, bottom);
                    
            // 
            // draw axes
            //
            xAxis.setLineColor(config.chartAxisColor()).drawTopAxis().drawBottomAxis().drawBottomTicks();
            yAxis.setLineColor(config.chartAxisColor()).drawRightAxis().drawLeftAxis().drawLeftTicks();

            if((poseTelemetry.count() > 0)) {
                // 
                // draw chart
                //
                lineChart.attachContext(context).setChartArea(left, top, right, bottom);

                //
                // Set data range for each axis.
                // Use a square aspect ratio.
                // 
                const xMinimum = poseTelemetry.minimum("x");
                const xMaximum = poseTelemetry.maximum("x");
                const xRange = xMaximum - xMinimum;
                const yMinimum = poseTelemetry.minimum("y");
                const yMaximum = poseTelemetry.maximum("y");
                const yRange = yMaximum - yMinimum;
                
                const canvasWidth = right - left;
                const canvasHeight = bottom - top;
                const xDistancePerPixel = xRange / canvasWidth;
                const yDistancePerPixel = yRange / canvasHeight;
                const distancePerPixel = max(xDistancePerPixel, yDistancePerPixel);

                // set distance based on distancePerPixel and aspect ratio
                const xWidth = canvasWidth * distancePerPixel;
                xAxis.setMinimum(xMinimum);
                xAxis.setMaximum(xAxis.minimum() + xWidth);
                const yHeight = canvasHeight * distancePerPixel;
                yAxis.setMinimum(yMinimum);
                yAxis.setMaximum(yAxis.minimum() + yHeight);

                // draw zero axes
                lineChart.setLineColor(config.chartAxisColor());
                lineChart.drawHorizontal(0, xAxis, yAxis, 3, 3);
                lineChart.drawVertical(0, xAxis, yAxis, 3, 3);
                yAxis.drawLeftText("0", 0);
                xAxis.drawTopText("0", 0);

                // (x, y) value
                lineChart.setLineColor(config.poseLineColor()).plotLine(poseTelemetry.iterator(), xAxis, yAxis);
                lineChart.setPointColor(config.posePointColor()).drawPoint(poseTelemetry.last(), xAxis, yAxis);

                // done
                lineChart.detachContext();

                // draw current position and orientation on bottom
                const currentPose = poseTelemetry.last();
                xAxis.drawBottomText(
                    `(${currentPose.x.toFixed(2)}, ${currentPose.y.toFixed(2)}, ${currentPose.a.toFixed(2)}`, 
                    xAxis.mid());
            } else {
                xAxis.setMinimum(0).setMaximum(1);
                yAxis.setMinimum(-1).setMaximum(1);
            }
            
            xAxis.drawBottomText(`${xAxis.minimum().toFixed(1)}`, xAxis.minimum());
            xAxis.drawBottomText(`${xAxis.maximum().toFixed(1)}`, xAxis.maximum());
            yAxis.drawLeftText(`${yAxis.minimum().toFixed(1)}`, yAxis.minimum());
            yAxis.drawLeftText(`${yAxis.maximum().toFixed(1)}`, yAxis.maximum());

            // done and done
            xAxis.detachContext();
            xAxis.detachContext();    
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
