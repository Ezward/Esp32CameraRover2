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

/**
 * Construct a axis
 */
function Axis() {
    let _min = 0;
    let _max = 1;
    let _context = undefined;
    let _left = 0;
    let _right = 1;
    let _top = 0;
    let _bottom = 1;
    let _ticks = 2;
    let _tickLength = 3;
    let _lineColor = "black";


    function isContextAttached() {
        return !!_context;
    }

    /**
     * Bind to a canvas context
     * 
     * @param {*} context   - // IN : canvas 2DContext 
     * @param {*} left      - // IN : left bound of plot area in canvas coordinates
     * @param {*} top       - // IN : top bound of plot area in canvas coordinates
     * @param {*} right     - // IN : right bound of plot area in canvas coordinates
     * @param {*} bottom    - // IN : bottom bound of plot area in canvas coordinates
     * @returns {LineChart} - // RET: this LineChart instance
     */
    function attachContext(context, left, top, right, bottom) {
        _context = context;
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

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

    function setMin(min) {
        _min = min;
        return self;
    }

    function min() {
        return _min;
    }

    function setMax(max) {
        _max = max;
        return self;
    }

    function max() {
        return _max;
    }

    function setTicks(numberOfTicks) {
        _ticks = numberOfTicks;
        return self;
    }

    function ticks() {
        return _ticks;
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


    const self = {
        "isContextAttached": isContextAttached,
        "attachContext": attachContext,
        "detachContext": detachContext,
        "setLineColor": setLineColor,
        "setChartArea": setChartArea,
        "setMin": setMin,
        "min": min,
        "setMax": setMax,
        "max": max,
        "setTicks": setTicks,
        "ticks": ticks,
        "drawLeftAxis": drawLeftAxis,
        "drawRightAxis": drawRightAxis,
        "drawLeftTicks": drawLeftTicks,
        "drawRightTicks": drawRightTicks,
        "drawTopAxis": drawTopAxis,
        "drawBottomAxis": drawBottomAxis,
        "drawTopTicks": drawTopTicks,
        "drawBottomTicks": drawBottomTicks,
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
        return ((pt.x >= xAxis.min()) && (pt.x < xAxis.max()) 
                && (pt.y >= yAxis.min()) && (pt.y < yAxis.max()));
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
            let p0 = _toCanvas(dataIterator.next(), xAxis, yAxis);

            while(dataIterator.hasNext()) {
                const p1 = _toCanvas(dataIterator.next(), xAxis, yAxis);

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
            let p0 = _toCanvas(dataIterator.next(), xAxis, yAxis);

            while(dataIterator.hasNext()) {
                const p1 = _toCanvas(dataIterator.next(), xAxis, yAxis);

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
            const p0 = _toCanvas(dataIterator.next(), xAxis, yAxis);

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
        if(y >= yAxis.min() && y < yAxis.max()) {
            if((typeof dashOn === "number") && (dashOn > 0)) {
                const onPixels = dashOn;
                let offPixels = dashOff;
                if((typeof dashOff === "number") && (dashOff > 0)) {
                    offPixels = dashOff;
                }
                _context.setLineDash([onPixels, offPixels]);
            }
            const p0 = _toCanvas(Point(xAxis.min(), y), xAxis, yAxis);
            const p1 = _toCanvas(Point(xAxis.max(), y), xAxis, yAxis);
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
        if(x >= xAxis.min() && x < xAxis.max()) {
            if((typeof dashOn === "number") && (dashOn > 0)) {
                const onPixels = dashOn;
                let offPixels = dashOff;
                if((typeof dashOff === "number") && (dashOff > 0)) {
                    offPixels = dashOff;
                }
                _context.setLineDash([onPixels, offPixels]);
            }
            const p0 = _toCanvas(Point(x, yAxis.min()), xAxis, yAxis);
            const p1 = _toCanvas(Point(x, yAxis.max()), xAxis, yAxis);
            _line(p0, p1);
            _context.setLineDash([]);   // reset to solid line
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
    function _toCanvas(pt, xAxis, yAxis) {
        const x = int(map(pt.x, xAxis.min(), xAxis.max(), _left, _right));
        const y = int(map(pt.y, yAxis.min(), yAxis.max(), _bottom, _top));

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
    function _toAxes(pt, xAxis, yAxis) {
        const x = map(pt.x, _left, _right, xAxis.min(), xAxis.max());
        const y = map(pt.y, _bottom, _top, yAxis.min(), yAxis.max());

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
        "setChartArea": setChartArea,
        "pointInChart": pointInChart,
        "plot": plot,
        "plotLine": plotLine,
        "plotPoints": plotPoints,
        "drawHorizontal": drawHorizontal,
        "drawVertical": drawVertical,
    } 

    return self;
}

