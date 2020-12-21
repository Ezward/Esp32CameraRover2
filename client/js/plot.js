// #include "./utilities.js"

//
// TODO: publish telemetry from RoverCommand as it is received.
// TODO: create Telemetry that listens for telemetry, maintains buffers, and publishes updates
// TODO: create CanvasViewController to maintain Canvas and handle resizing; it takes a CanvasPainter 
// TODO: create a CanvasPainter that renders motor telemetry
// TODO: create a CanvasPainter that renders rover pose
// TODO: implement a rover reset command that restarts encoder and pose from zero.
//

/**
 * Construct an x,y point
 * 
 * @param {number} x 
 * @param {number} y 
 */
function Point(x, y) {
    return {x: x, y: y};
}

const ChartUtils = (function() {
    /**
     * Calculate area required by labels and ticks
     * and use this to set char area.
     * 
     * @param {string} leftTicksText  - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @param {string} rightTicksText - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @returns {object}              - // RET: border sizes as {left, top, right, bottom}
     */
    /**
     * Calculate area required by labels and ticks
     * and use this to set char area.
     * 
     * @param {CanvasRenderingContext2D} context 
     * @param {number} tickLength 
     * @param {string} leftTicksText  - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @param {string} rightTicksText - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @returns {object}              - // RET: border sizes as {left, top, right, bottom}
     */
    function calcBorders(context, tickLength, leftTicksText = "888.8", rightTicksText = "888.8") {
        // leave space for labels
        const leftMetrics = context.measureText(leftTicksText);
        const rightMetrics = context.measureText(rightTicksText);
        const leftBorderWidth = int(leftMetrics.actualBoundingBoxLeft + leftMetrics.actualBoundingBoxRight + tickLength + 2);
        const rightBorderWidth = int(rightMetrics.actualBoundingBoxLeft + rightMetrics.actualBoundingBoxRight + tickLength + 2);

        const borderHeight = int(
            max(leftMetrics.actualBoundingBoxAscent + leftMetrics.actualBoundingBoxDescent, 
                rightMetrics.actualBoundingBoxAscent + rightMetrics.actualBoundingBoxDescent) + tickLength + 2);

        return {
            "left": leftBorderWidth,
            "top": borderHeight,
            "right": rightBorderWidth,
            "bottom": borderHeight,
        };
    }

    const self = {
        "calcBorders": calcBorders,
    };

    return self;
})();

/**
 * Construct a axis
 */
function Axis() {
    let _min = 0;
    let _max = 1;
    let _context = undefined;
    let _contextWidth = 0;
    let _contextHeight = 0;
    let _left = 0;
    let _right = 1;
    let _top = 0;
    let _bottom = 1;
    let _ticks = 2;
    let _tickLength = 3;
    let _lineColor = "white";


    function isContextAttached() {
        return !!_context;
    }

    /**
     * 
     * Bind to a canvas context
     * 
     * @param {*} context        - // IN : canvas Context2D 
     * @param {number} width     - // IN : canvas width in pixels
     * @param {number} height    - // IN : canvas height in pixels
     * @param {string} leftText  - // IN : template for left margin text
     *                             //      used to calculate margin size
     * @param {string} rightText - // IN : template for right margin text
     *                             //      used to calculate margin size
     * @returns {LineChart}      - // RET: this LineChart instance
     */
    function attachContext(context) {
        _context = context;
        _contextWidth = _context.canvas.width;
        _contextHeight = _context.canvas.height;
        return self;
    }

    function detachContext() {
        _context = null;
        return self;
    }

    function setLineColor(lineColor) {
        _lineColor = lineColor;
        return self;
    }

    /**
     * Calculate area required by labels and ticks
     * and use this to set char area.
     * 
     * @param {string} leftTicksText  - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @param {string} rightTicksText - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @returns {object}              - // RET: this Axis
     */
    function autoSetChartArea(leftTicksText = "888.8", rightTicksText = "888.8") {
        const borders = ChartUtils.calcBorders(_context, _contextWidth, _contextHeight, _tickLength);
        return setChartArea(borders.left, borders.top, _contextWidth - borders.right, _contextHeight - borders.bottom);
    }

    /**
     * Set draw area for chart.
     * 
     * @param {number} left      - // IN : left bound of plot area in canvas coordinates
     * @param {number} top       - // IN : top bound of plot area in canvas coordinates
     * @param {number} right     - // IN : right bound of plot area in canvas coordinates
     * @param {number} bottom    - // IN : bottom bound of plot area in canvas coordinates
     */
    function setChartArea(left, top, right, bottom) {
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

        return self;
    }

    function setMinimum(min) {
        _min = min;
        return self;
    }

    function minimum() {
        return _min;
    }

    function setMaximum(max) {
        _max = max;
        return self;
    }

    function maximum() {
        return _max;
    }

    function mid() {
        return _min + (_max - _min) / 2;
    }

    function setTicks(numberOfTicks) {
        _ticks = numberOfTicks;
        return self;
    }

    function ticks() {
        return _ticks;
    }

    function tickLength() {
        return _tickLength;
    }

    function setTickLength(tickLength) {
        _tickLength = tickLength;
        return self;
    }


    function drawLeftAxis() {
        return _drawAxisY(_left);
    }
    function drawRightAxis() {
        return _drawAxisY(_right);
    }

    function drawLeftTicks() {
        return _drawTicksY(_left, _tickLength);
    }
    function drawRightTicks() {
        return _drawTicksY(_right, -_tickLength);
    }

    function drawBottomAxis() {
        return _drawAxisX(_bottom);
    }
    function drawTopAxis() {
        return _drawAxisX(_top);
    }

    function drawBottomTicks() {
        return _drawTicksX(_bottom, _tickLength);
    }
    function drawTopTicks() {
        return _drawTicksX(_top, -_tickLength);
    }


    function drawLeftText(text, y) {
        return _drawText(text, _left - (_tickLength + 1), _toCanvasY(y), 'right');
    }

    function drawRightText(text, y) {
        return _drawText(text, _right + (_tickLength + 1), _toCanvasY(y), 'left');
    }

    function drawTopText(text, x) {
        return _drawText(text, _toCanvasX(x), _top - (_tickLength + 1), 'center');
    }

    function drawBottomText(text, x) {
        return _drawText(text, _toCanvasX(x), _bottom + (_tickLength + 1), 'center', 'top');
    }

    function _drawText(text, x, y, align = 'center', baseline = 'middle') {
        if(!isContextAttached()) {
            console.error("Drawing Axis text requires an attached context");
            return self;
        }

        if(typeof text !== 'string') {
            return self;
        }

        _context.fillStyle = _lineColor;
        _context.textAlign = align;
        _context.textBaseline = baseline;
        _context.fillText(text, x, y);

        return self;
    }

    function _drawAxisX(y) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(_left, y);
        _context.lineTo(_right, y);
        _context.stroke();

        return self;
    }

    function _drawTicksX(y, tickLength) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;

        const width = (_right - _left);
        for(let i = 0; i < _ticks; i += 1) {
            const x = _left + ((_ticks > 1) ? int(i * width / (_ticks - 1)) : 0);
            _context.beginPath();
            _context.moveTo(x, y);
            _context.lineTo(x, y + tickLength);
            _context.stroke();
        }
        return self;
    }

    function _drawAxisY(x) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }
        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(x, _bottom);
        _context.lineTo(x, _top);
        _context.stroke();

        return self;
    }

    function _drawTicksY(x, tickLength) {
        if(!isContextAttached()) {
            console.error("Drawing an Axis requires an attached context");
            return self;
        }

        _context.strokeStyle = _lineColor;

        const height = (_bottom - _top);
        for(let i = 0; i < _ticks; i += 1) {
            const y = _bottom - ((_ticks > 1) ? int(i * height / (_ticks - 1)) : 0)
            _context.beginPath();
            _context.moveTo(x, y);
            _context.lineTo(x - tickLength, y);
            _context.stroke();
        }
        return self;
    }

    /**
     * Map a horizontal value from axis coordinates to canvas coordinates
     */
    function _toCanvasX(x) {
        return int(map(x, minimum(), maximum(), _left, _right));
    }

    /**
     * Map a vertical value from axis coordinates to canvas coordinates
     */
    function _toCanvasY(y) {
        return int(map(y, minimum(), maximum(), _bottom, _top));
    }


    const self = {
        "isContextAttached": isContextAttached,
        "attachContext": attachContext,
        "detachContext": detachContext,
        "setLineColor": setLineColor,
        "setChartArea": setChartArea,
        "autoSetChartArea": autoSetChartArea,
        "setMinimum": setMinimum,
        "minimum": minimum,
        "setMaximum": setMaximum,
        "maximum": maximum,
        "mid": mid,
        "setTicks": setTicks,
        "ticks": ticks,
        "setTickLength": setTickLength,
        "tickLength": tickLength,
        "drawLeftAxis": drawLeftAxis,
        "drawRightAxis": drawRightAxis,
        "drawLeftTicks": drawLeftTicks,
        "drawRightTicks": drawRightTicks,
        "drawTopAxis": drawTopAxis,
        "drawBottomAxis": drawBottomAxis,
        "drawTopTicks": drawTopTicks,
        "drawBottomTicks": drawBottomTicks,
        "drawLeftText": drawLeftText,
        "drawRightText": drawRightText,
        "drawTopText": drawTopText,
        "drawBottomText": drawBottomText,
    }

    return self;
}

/**
 * Construct a line chart.
 */
function LineChart() {
    let _context = undefined;
    let _left = 0;
    let _right = 1;
    let _top = 0;
    let _bottom = 1;
    let _lineColor = "blue";
    let _pointColor = "red";
    let _textColor = "green";

    function isContextAttached() {
        return !!_context;
    }

    /**
     * Bind to a canvas context
     * 
     * @param {*} context     - IN : canvas 2DContext 
     * @param {number} left   - IN : left bound of plot area in canvas coordinates
     * @param {number} top    - IN : top bound of plot area in canvas coordinates
     * @param {number} right  - IN : right bound of plot area in canvas coordinates
     * @param {number} bottom - IN : bottom bound of plot area in canvas coordinates
     * @returns {LineChart}   - RET: this LineChart instance
     */
    function attachContext(context) {
        _context = context;
        
        return self;
    }

    function detachContext() {
        _context = null;
        return self;
    }

    function setLineColor(lineColor) {
        _lineColor = lineColor;
        return self;
    }

    function setPointColor(pointColor) {
        _pointColor = pointColor;
        return self;
    }

    function setTextColor(textColor) {
        _textColor = textColor;
        return self;
    }

    /**
     * Calculate area required by labels and ticks
     * and use this to set char area.
     * 
     * @param {string} leftTicksText  - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @param {string} rightTicksText - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @returns {object}              - // RET: this Axis
     */
    function autoSetChartArea(leftTicksText = "888.8", rightTicksText = "888.8") {
        const borders = ChartUtils.calcBorders(_context, _contextWidth, _contextHeight, _tickLength);
        return setChartArea(borders.left, borders.top, _contextWidth - borders.right, _contextHeight - borders.bottom);
    }

    /**
     * Set draw area for chart.
     * 
     * @param {number} left 
     * @param {number} top 
     * @param {number} right 
     * @param {number} bottom 
     */
    function setChartArea(left, top, right, bottom) {
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

        return self;
    }

    function _pointInChartArea(pt) {
        return ((pt.x >= _left) && (pt.x < _right) 
                && (pt.y >= _top) && (pt.y < _bottom));
    }


    /**
     * Determine if a point {x, y} is in chart bounds.
     * 
     * @param {*} pt 
     * @param {*} xAxis 
     * @param {*} yAxis 
     */
    function pointInChart(pt, xAxis, yAxis) {
        return ((pt.x >= xAxis.minimum()) && (pt.x < xAxis.maximum()) 
                && (pt.y >= yAxis.minimum()) && (pt.y < yAxis.maximum()));
    }

    /**
     * Line chart with points.
     * 
     * @param {object} dataIterator 
     * @param {Axis} xAxis 
     * @param {Axis} yAxis 
     * @returns {LineChart} this LineChart
     */
    function plot(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        if(dataIterator.hasNext()) {
            let p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            while(dataIterator.hasNext()) {
                const p1 = toCanvas(dataIterator.next(), xAxis, yAxis);

                if(_pointInChartArea(p0)) 
                {
                    //
                    // line segment from p0 to p1
                    //
                    if(_pointInChartArea(p1)) {
                        _line(p0, p1)
                    }

                    //
                    // point at p0
                    //
                    _point(p0);
                }
                p0 = p1
            }

            // last point
            if(_pointInChartArea(p0)) {
                _point(p0);
            }
        }

        return self;
    }

    /**
     * Line plot without points.
     * 
     * @param {object} dataIterator 
     * @param {Axis} xAxis 
     * @param {Axis} yAxis 
     * @returns {LineChart} - // RET: this LineChart
     */
    function plotLine(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        if(dataIterator.hasNext()) {
            let p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            while(dataIterator.hasNext()) {
                const p1 = toCanvas(dataIterator.next(), xAxis, yAxis);

                //
                // line segment from p0 to p1
                //
                if(_pointInChartArea(p0)) 
                {
                    if(_pointInChartArea(p1)) {
                        _line(p0, p1)
                    }
                }
                p0 = p1
            }
        }

        return self;
    }

    /**
     * Plot points only.
     * 
     * @param {object} dataIterator 
     * @param {Axis} xAxis 
     * @param {Axis} yAxis 
     * @returns {LineChart} - // RET: this LineChart
     */
    function plotPoints(dataIterator, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        _validateDataIterator(dataIterator);

        while(dataIterator.hasNext()) {
            const p0 = toCanvas(dataIterator.next(), xAxis, yAxis);

            if(_pointInChartArea(p0)) {
                _point(p0);
            }
        }

        return self;
    }

    /**
     * Draw horizontal line from left to right of chart.
     * 
     * @param {number} y 
     * @param {*} xAxis 
     * @param {*} yAxis 
     * @param {number} dashOn - positive integer for dashed line.  
     *                          This is teh length of the dash, and if
     *                          no dashOff is supplied, the length of 
     *                          the gap. defaults to 0, no dash.
     * @param {number} dashOff - if a positive integer, then this is the
     *                           length of the gap. defaults to zero,
     *                           so dashOn is used for gap.
     */
    function drawHorizontal(y, xAxis, yAxis, dashOn = 0, dashOff = 0) {
        if(!isContextAttached()) {
            console.error("Drawing requires an attached context");
            return self;
        }

        if(y >= yAxis.minimum() && y < yAxis.maximum()) {
            if((typeof dashOn === "number") && (dashOn > 0)) {
                const onPixels = dashOn;
                let offPixels = dashOff;
                if((typeof dashOff === "number") && (dashOff > 0)) {
                    offPixels = dashOff;
                }
                _context.setLineDash([onPixels, offPixels]);
            }
            const p0 = toCanvas(Point(xAxis.minimum(), y), xAxis, yAxis);
            const p1 = toCanvas(Point(xAxis.maximum(), y), xAxis, yAxis);
            _line(p0, p1);
            _context.setLineDash([]);   // reset to solid line

        }

        return self;
    }

    /**
     * Draw vertical line from top to bottom of chart.
     * 
     * @param {*} x 
     * @param {*} xAxis 
     * @param {*} yAxis 
     * @param {number} dashOn - positive integer for dashed line.  
     *                          This is teh length of the dash, and if
     *                          no dashOff is supplied, the length of 
     *                          the gap. defaults to 0, no dash.
     * @param {number} dashOff - if a positive integer, then this is the
     *                           length of the gap. defaults to zero,
     *                           so dashOn is used for gap.
     */
    function drawVertical(x, xAxis, yAxis, dashOn = 0, dashOff = 0) {
        if(!isContextAttached()) {
            console.error("Drawing requires an attached context");
            return self;
        }

        if(x >= xAxis.minimum() && x < xAxis.maximum()) {
            if((typeof dashOn === "number") && (dashOn > 0)) {
                const onPixels = dashOn;
                let offPixels = dashOff;
                if((typeof dashOff === "number") && (dashOff > 0)) {
                    offPixels = dashOff;
                }
                _context.setLineDash([onPixels, offPixels]);
            }
            const p0 = toCanvas(Point(x, yAxis.minimum()), xAxis, yAxis);
            const p1 = toCanvas(Point(x, yAxis.maximum()), xAxis, yAxis);
            _line(p0, p1);
            _context.setLineDash([]);   // reset to solid line
        }

        return self;
    }

    /**
     * Draw text at an arbitrary location in the chart area.
     * Clipping is done against the provided point (x,y);
     * if that point falls within the chart area then 
     * the text will be drawn, otherwise it will not be drawn.
     * 
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {object} xAxis 
     * @param {object} yAxis 
     * @param {string} align 
     * @param {string} baseline 
     */
    function drawText(text, x, y, xAxis, yAxis, align = 'center', baseline = 'middle') {
        if(!isContextAttached()) {
            console.error("Drawing Chart text requires an attached context");
            return self;
        }

        if(x >= xAxis.minimum() && x < xAxis.maximum()) {
            if((y >= yAxis.minimum()) && (y < yAxis.maximum())) {
                const p0 = toCanvas(Point(x, y), xAxis, yAxis);
                _drawText(text, p0.x, p0.y, align, baseline);
            }
        }

        return self;
    }

    /**
     * Map a Point from axis coordinates to canvas coordinates
     * 
     * @param {Point} pt   - IN : {x, y} in Axis coordinates
     * @param {Axis} xAxis - IN : horizontal Axis
     * @param {Axis} yAxis - IN : vertical Axis
     * @returns {Point}    - RET: {x, y} in Canvas coordinates
     */
    function toCanvas(pt, xAxis, yAxis) {
        const x = int(map(pt.x, xAxis.minimum(), xAxis.maximum(), _left, _right));
        const y = int(map(pt.y, yAxis.minimum(), yAxis.maximum(), _bottom, _top));

        return Point(x, y);
    }

    /**
     * Map a Point from canvas coordinates to axis coordinates
     * 
     * @param {Point} pt   - IN : {x, y} in Axis coordinates
     * @param {Axis} xAxis - IN : horizontal Axis
     * @param {Axis} yAxis - IN : vertical Axis
     * @returns {Point}    - RET: {x, y} in Canvas coordinates
     */
    function toAxes(pt, xAxis, yAxis) {
        const x = map(pt.x, _left, _right, xAxis.minimum(), xAxis.maximum());
        const y = map(pt.y, _bottom, _top, yAxis.minimum(), yAxis.maximum());

        return Point(x, y);
    }

    function _line(p0, p1) {
        //
        // line segment from p0 to p1
        //
        _context.strokeStyle = _lineColor;
        _context.beginPath();
        _context.moveTo(p0.x, p0.y);
        _context.lineTo(p1.x, p1.y);
        _context.stroke();
    }    

    function _point(pt) {
        _context.strokeStyle = _pointColor;
        _context.beginPath();
        _context.moveTo(pt.x - 1, pt.y - 1);
        _context.lineTo(pt.x + 1, pt.y - 1);
        _context.lineTo(pt.x + 1, pt.y + 1);
        _context.lineTo(pt.x - 1, pt.y + 1);
        _context.lineTo(pt.x - 1, pt.y - 1);
        _context.stroke();
    }

    function _drawText(text, x, y, align = 'center', baseline = 'middle') {
        _context.fillStyle = _textColor;
        _context.textAlign = align;
        _context.textBaseline = baseline;
        _context.fillText(text, x, y);
    }


    function _validateDataIterator(dataIterator) {
        //
        // make sure dataIterator is a valid iterator
        //
        if((!dataIterator.hasOwnProperty("hasNext")) || (typeof dataIterator.hasNext != "function")) {
            throw TypeError("dataIterator must have a hasNext method");
        }
        if((!dataIterator.hasOwnProperty("next")) || (typeof dataIterator.next != "function")) {
            throw TypeError("dataIterator must have a next method");
        }
    }

    const self = {
        "isContextAttached": isContextAttached,
        "attachContext": attachContext,
        "detachContext": detachContext,
        "setLineColor": setLineColor,
        "setPointColor": setPointColor,
        "setTextColor": setTextColor,
        "setChartArea": setChartArea,
        "autoSetChartArea": autoSetChartArea,
        "pointInChart": pointInChart,
        "toCanvas": toCanvas,
        "toAxes": toAxes,
        "plot": plot,
        "plotLine": plotLine,
        "plotPoints": plotPoints,
        "drawHorizontal": drawHorizontal,
        "drawVertical": drawVertical,
        "drawText": drawText,
    } 

    return self;
}

