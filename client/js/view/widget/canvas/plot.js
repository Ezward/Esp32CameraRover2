/// <reference path="../../../utilities/utilities.js" />

// #include "./utilities.js"


/**
 * @summary Canvas fill style
 * @typedef {string | CanvasGradient | CanvasPattern} CanvasFillStyleType
 */

/**
 * @typedef {object} Point2dType
 * @property {number} x
 * @property {number} y
 */

/**
 * @summary Construct an x,y point
 * 
 * @param {number} x 
 * @param {number} y 
 * @returns {Point2dType}
 */
function Point(x, y) {
    if (typeof x !== "number" || typeof y !== "number") {
        console.log(`WARNING: Point constructed with non-number (${x},${y})`)
    }
    return {x: x, y: y};
}

/**
 * @summary Iterator for (x,y) points
 * 
 * @typedef {object} Point2dIteratorType
 * @property {() => boolean} hasNext
 * @property {() => Point2dType} next
 */

/**
 * Construct telemetry iterator that returns (x, y) pairs.
 * 
 * @param {TelemetryListenerType} telemetry 
 * @returns {Point2dIteratorType}
 */
function Point2dIterator(telemetry) {
    let i = 0;
    function hasNext() {
        return i < telemetry.count();
    }
    function next() {
        if(hasNext()) {
            const value = telemetry.get(i);
            i += 1;
            return Point(value.x, value.y);
        }
        throw RangeError("PointIterator is out of range.")
    }

    return {
        "hasNext": hasNext,
        "next": next,
    }
}



/**
 * @summary Struct to hold border thicknesses.
 * 
 * @typedef {object} BorderType
 * @property {number} left
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 */

/**
 * @summary Singleton with chart utilities.
 * @description Chart utilities to calculate the border thicknesses 
 *              given axis' text and tick length.
 */
const ChartUtils = (function() {
    /**
     * Calculate area required by labels and ticks
     * and use this to set char area.
     * 
     * @param {CanvasRenderingContext2D} context 
     * @param {number} tickLength 
     * @param {string} leftTicksText  // IN : string representing widest possible tick label,
     *                                        defaults to "888.8"
     * @param {string} rightTicksText // IN : string representing widest possible tick label,
     *                                        defaults to "888.8"
     * @returns {BorderType}          // RET: border sizes as {left, top, right, bottom}
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

    const self = Object.freeze({
        "calcBorders": calcBorders,
    });

    return self;
})();

/**
 * @summary An axis instance.
 * @description An axis is a edge bordering the active chart area
 *              on top, bottom, left or right edges.
 *              An axis has a minimum and maximum value, so it
 *              represents a range of values.
 *              An axis can have ticks and text drawn on it.
 * 
 * @typedef {object} AxisType
 * @property {() => boolean} isContextAttached
 * @property {(context: CanvasRenderingContext2D) => AxisType} attachContext
 * @property {() => AxisType} detachContext
 * @property {(lineColor: any) => AxisType} setLineColor
 * @property {(left: number, top: number, right: number, bottom: number) => Axis} setLineColor
 * @property {(leftTicksText?: string, rightTicksText?: string) => AxisType} autoSetChartArea
 * @property {(left: number, top: number, right: number, bottom: number) => AxisType} setChartArea
 * @property {(min: number) => AxisType} setMinimum
 * @property {() => number} minimum
 * @property {(max: number) => AxisType} setMaximum
 * @property {() => number} maximum
 * @property {() => number} mid
 * @property {(numberOfTicks: number) => AxisType} setTicks
 * @property {() => number} ticks
 * @property {() => number} tickLength
 * @property {(tickLength: number) => AxisType} setTickLength
 * @property {() => AxisType} drawLeftAxis
 * @property {() => AxisType} drawRightAxis
 * @property {() => AxisType} drawLeftTicks
 * @property {() => AxisType} drawRightTicks
 * @property {() => AxisType} drawBottomAxis
 * @property {() => AxisType} drawTopAxis
 * @property {() => AxisType} drawBottomTicks
 * @property {() => AxisType} drawTopTicks
 * @property {(text: string, y: number) => AxisType} drawLeftText
 * @property {(text: string, y: number) => AxisType} drawRightText
 * @property {(text: string, x: number) => AxisType} drawTopText
 * @property {(text: string, x: number) => AxisType} drawBottomText
 */

/**
 * @summary Construct a axis instance.
 * @description An axis is a edge bordering the active chart area
 *              on top, bottom, left or right edges.
 *              An axis has a minimum and maximum value, so it
 *              represents a range of values.
 *              An axis can have ticks and text drawn on it.
 * 
 * @returns {AxisType}
 */
function Axis() {
    let _min = 0;
    let _max = 1;

    /** @type {CanvasRenderingContext2D} */
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


    /**
     * @summary Determine if a canvas context is attached.
     * 
     * @returns {boolean}
     */
    function isContextAttached() {
        return !!_context;
    }

    /**
     * @summary Bind to a canvas context
     * 
     * @param {CanvasRenderingContext2D} context // IN : canvas Context2D 
     * @return {AxisType} // RET: this Axis for fluent chain calls
     */
    function attachContext(context) {
        _context = context;
        _contextWidth = _context.canvas.width;
        _contextHeight = _context.canvas.height;
        return self;
    }

    /**
     * @summary Detach the canvas context.
     * 
     * @return {AxisType} // RET: this Axis for fluent chain calls
     */
    function detachContext() {
        _context = null;
        return self;
    }

    /**
     * @summary Set the line drawing color.
     * 
     * @param {string} lineColor 
     * @return {AxisType} // RET: this Axis for fluent chain calls
     */
    function setLineColor(lineColor) {
        _lineColor = lineColor;
        return self;
    }

    /**
     * @summary Calculate area required by labels and ticks
     *          and use this to set chart area.
     * 
     * @param {string} leftTicksText  // IN : string representing widest possible tick label,
     *                                        defaults to "888.8"
     * @param {string} rightTicksText // IN : string representing widest possible tick label,
     *                                        defaults to "888.8"
     * @return {AxisType}             // RET: this Axis for fluent chain calls
     */
    function autoSetChartArea(leftTicksText = "888.8", rightTicksText = "888.8") {
        const borders = ChartUtils.calcBorders(_context, _tickLength, leftTicksText, rightTicksText);
        return setChartArea(borders.left, borders.top, _contextWidth - borders.right, _contextHeight - borders.bottom);
    }

    /**
     * @summary Set draw area for chart.
     * 
     * @param {number} left      // IN : left bound of plot area in canvas coordinates
     * @param {number} top       // IN : top bound of plot area in canvas coordinates
     * @param {number} right     // IN : right bound of plot area in canvas coordinates
     * @param {number} bottom    // IN : bottom bound of plot area in canvas coordinates
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setChartArea(left, top, right, bottom) {
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

        return self;
    }

    /**
     * @summary Set axis' minimum value.
     * 
     * @param {number} min 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setMinimum(min) {
        _min = min;
        return self;
    }

    /**
     * @summary Get axis' minimum value.
     * 
     * @returns {number}
     */
    function minimum() {
        return _min;
    }

    /**
     * @summary Set axis' maximum value.
     * 
     * @param {number} max 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setMaximum(max) {
        _max = max;
        return self;
    }

    /**
     * @summary Get axis' maximum value.
     * 
     * @returns {number}
     */
    function maximum() {
        return _max;
    }

    /**
     * @summary Get axis' mid value.
     * 
     * @returns {number}
     */
    function mid() {
        return _min + (_max - _min) / 2;
    }

    /**
     * @summary Set the number of ticks on the axis.
     * 
     * @param {number} numberOfTicks 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setTicks(numberOfTicks) {
        _ticks = numberOfTicks;
        return self;
    }

    /**
     * @summary Get number of ticks on the axis.
     * 
     * @returns {number}
     */
    function ticks() {
        return _ticks;
    }

    /**
     * @summary Get the tick length in pixels.
     * 
     * @returns {number}
     */
    function tickLength() {
        return _tickLength;
    }

    /**
     * @summary Set the tick length in pixels.
     * 
     * @param {number} tickLength 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function setTickLength(tickLength) {
        _tickLength = tickLength;
        return self;
    }


    /**
     * @summary Draw the axis as a left axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawLeftAxis() {
        return _drawAxisY(_left);
    }

    /**
     * @summary Draw the axis as a right axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawRightAxis() {
        return _drawAxisY(_right);
    }

    /**
     * @summary Draw the axis ticks as a left axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawLeftTicks() {
        return _drawTicksY(_left, _tickLength);
    }

    /**
     * @summary Draw the axis ticks as a right axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawRightTicks() {
        return _drawTicksY(_right, -_tickLength);
    }

    /**
     * @summary Draw the axis as a bottom axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawBottomAxis() {
        return _drawAxisX(_bottom);
    }

    /**
     * @summary Draw the axis as a top axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawTopAxis() {
        return _drawAxisX(_top);
    }

    /**
     * @summary Draw the axis ticks as a bottom axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawBottomTicks() {
        return _drawTicksX(_bottom, _tickLength);
    }

    /**
     * @summary Draw the axis ticks as a top axis.
     * 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawTopTicks() {
        return _drawTicksX(_top, -_tickLength);
    }

    /**
     * @summary Draw text on the left axis.
     * 
     * @param {string} text 
     * @param {number} y 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawLeftText(text, y) {
        return _drawText(text, _left - (_tickLength + 1), _toCanvasY(y), 'right');
    }

    /**
     * @summary Draw text on the right axis.
     * 
     * @param {string} text 
     * @param {number} y 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawRightText(text, y) {
        return _drawText(text, _right + (_tickLength + 1), _toCanvasY(y), 'left');
    }

    /**
     * @summary Draw text on the top axis.
     * 
     * @param {string} text 
     * @param {number} x 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawTopText(text, x) {
        return _drawText(text, _toCanvasX(x), _top - (_tickLength + 1), 'center');
    }

    /**
     * @summary Draw text on the bottom axis.
     * 
     * @param {string} text 
     * @param {number} x 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
    function drawBottomText(text, x) {
        return _drawText(text, _toCanvasX(x), _bottom + (_tickLength + 1), 'center', 'top');
    }

    /**
     * @summary Draw text at the given position.
     * 
     * @private
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {CanvasTextAlign} align 
     * @param {CanvasTextBaseline} baseline 
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
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

    /**
     * @summary Draw horizontal axis line.
     * 
     * @private
     * @param {number} y // IN : vertical position of horizontal axis.
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
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

    /**
     * @summary Draw ticks on a horizontal axis.
     * 
     * @private
     * @param {number} y           // IN : vertical position of horizontal axis.
     * @param {number} tickLength  // IN : length of tick in pixels.
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
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

    /**
     * @summary Draw a vertical axis line.
     * 
     * @private
     * @param {number} x // IN : horizontal position of the vertial axis.
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
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

    /**
     * @summary Draw ticks on a vertical axis.
     * 
     * @private
     * @param {number} x          // IN : horizontal position of vertical axis.
     * @param {number} tickLength // IN : length of ticks in pixels.
     * @return {AxisType}        // RET: this Axis for fluent chain calls
     */
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
     * @summary Map a horizontal value from axis coordinates to canvas coordinates
     * 
     * @private
     * @param {number} x // IN : horizontal axis coordinate
     * @returns {number} // RET: horizontal canvas coordinates
     */
    function _toCanvasX(x) {
        return int(map(x, minimum(), maximum(), _left, _right));
    }

    /**
     * @summary Map a vertical value from axis coordinates to canvas coordinates
     * 
     * @private
     * @param {number} y // IN : vertical axis coordinate
     * @returns {number} // RET: vertical canvas coordinate
     */
    function _toCanvasY(y) {
        return int(map(y, minimum(), maximum(), _bottom, _top));
    }

    /** @type {AxisType} */
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
 * @typedef {object} LineChartType
 * @property {() => boolean} isContextAttached
 * @property {(context: CanvasRenderingContext2D) => LineChartType} attachContext
 * @property {() => LineChartType} detachContext
 * @property {(lineColor: string) => LineChartType} setLineColor
 * @property {(pointColor: string) => LineChartType} setPointColor
 * @property {(textColor: string) => LineChartType} setTextColor
 * @property {(leftTicksText?: string, rightTicksText?: string) => LineChartType} autoSetChartArea
 * @property {(left: number, top: number, right: number, bottom: number) => LineChartType} setChartArea
 * @property {(pt: Point2dType, xAxis: AxisType, yAxis: AxisType) => boolean} pointInChart
 * @property {(dataIterator: Point2dIteratorType, xAxis: AxisType, yAxis: AxisType) => LineChartType} plot
 * @property {(dataIterator: Point2dIteratorType, xAxis: AxisType, yAxis: AxisType) => LineChartType} plotLine
 * @property {(dataIterator: Point2dIteratorType, xAxis: AxisType, yAxis: AxisType) => LineChartType} plotPoints
 * @property {(p0: Point2dType, xAxis: AxisType, yAxis: AxisType) => LineChartType} drawPoint
 * @property {(y: number, xAxis: AxisType, yAxis: AxisType, dashOn?: number, dashOff?: number) => LineChartType} drawHorizontal
 * @property {(x: number, xAxis: AxisType, yAxis: AxisType, dashOn?: number, dashOff?: number) => LineChartType} drawVertical
 * @property {(text: string, x: number, y: number, xAxis: AxisType, yAxis: AxisType, align?: CanvasTextAlign, baseline?: CanvasTextBaseline) => LineChartType} drawText
 * @property {(pt: Point2dType, xAxis: AxisType, yAxis: AxisType) => Point2dType} toCanvas
 * @property {(pt: Point2dType, xAxis: AxisType, yAxis: AxisType) => Point2dType} toAxes
 */
/**
 * Construct a line chart.
 * @returns {LineChartType}
 */
function LineChart() {
    /** @type {CanvasRenderingContext2D} */
    let _context = undefined;
    let _contextWidth = 0;
    let _contextHeight = 0;
    let _left = 0;
    let _right = 1;
    let _top = 0;
    let _bottom = 1;
    let _lineColor = "blue";
    let _pointColor = "red";
    let _textColor = "green";

    /**
     * Determine if a canvas context is attached.
     * 
     * @returns {boolean}
     */
    function isContextAttached() {
        return !!_context;
    }

    /**
     * Bind to a canvas context
     * 
     * @param {CanvasRenderingContext2D} context // IN : canvas Context2D 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function attachContext(context) {
        _context = context;
        _contextWidth = _context.canvas.width;
        _contextHeight = _context.canvas.height;
        return self;
    }

    /**
     * Detach the canvas context.
     * 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function detachContext() {
        _context = null;
        return self;
    }

    /**
     * Set line drawing color.
     * 
     * @param {string} lineColor 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function setLineColor(lineColor) {
        _lineColor = lineColor;
        return self;
    }

    /**
     * Set drawing color for points in chart.
     * 
     * @param {string} pointColor 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function setPointColor(pointColor) {
        _pointColor = pointColor;
        return self;
    }

    /**
     * Set the text drawing color.
     * 
     * @param {string} textColor 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function setTextColor(textColor) {
        _textColor = textColor;
        return self;
    }

    /**
     * Calculate area required by labels and ticks
     * and use this to set the chart area.
     * 
     * @param {string} leftTicksText  - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @param {string} rightTicksText - // IN : string representing widest possible tick label,
     *                                          defaults to "888.8"
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function autoSetChartArea(leftTicksText = "888.8", rightTicksText = "888.8") {
        const borders = ChartUtils.calcBorders(_context, 0 /*_tickLength*/, leftTicksText, rightTicksText);
        return setChartArea(borders.left, borders.top, _contextWidth - borders.right, _contextHeight - borders.bottom);
    }

    /**
     * Set draw area for chart.
     * 
     * @param {number} left 
     * @param {number} top 
     * @param {number} right 
     * @param {number} bottom 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function setChartArea(left, top, right, bottom) {
        _left = left;
        _right = right;
        _top = top;
        _bottom = bottom;   

        return self;
    }

    /**
     * Determine if the given (x,y) is in the chart area.
     * 
     * @param {Point2dType} pt 
     * @returns {boolean}
     */
    function _pointInChartArea(pt) {
        return ((pt.x >= _left) && (pt.x < _right) 
                && (pt.y >= _top) && (pt.y < _bottom));
    }


    /**
     * Determine if a point {x, y} is in chart bounds.
     * 
     * @param {Point2dType} pt 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @returns {boolean}
     */
    function pointInChart(pt, xAxis, yAxis) {
        return ((pt.x >= xAxis.minimum()) && (pt.x <= xAxis.maximum()) 
                && (pt.y >= yAxis.minimum()) && (pt.y <= yAxis.maximum()));
    }

    /**
     * Line chart with points.
     * 
     * @param {Point2dIteratorType} dataIterator 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @return {LineChartType} // RET: this LineChart for fluent chain calls
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
     * @param {Point2dIteratorType} dataIterator 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
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
     * @param {Point2dIteratorType} dataIterator 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
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
     * Draw a single point.
     * 
     * @param {Point2dType} p0 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function drawPoint(p0, xAxis, yAxis) {
        if(!isContextAttached()) {
            console.error("Plotting a LineChart requires an attached context");
            return self;
        }

        const chartPt = toCanvas(p0, xAxis, yAxis);
        if(_pointInChartArea(chartPt)) {
            _point(chartPt);
        }

        return self;
    }

    /**
     * Draw horizontal line from left to right of chart.
     * 
     * @param {number} y 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @param {number} dashOn   // IN : positive integer for dashed line.  
     *                                  This is teh length of the dash, and if
     *                                  no dashOff is supplied, the length of 
     *                                  the gap. defaults to 0, no dash.
     * @param {number} dashOff  // IN : if a positive integer, then this is the
     *                                  length of the gap. defaults to zero,
     *                                  so dashOn is used for gap.
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function drawHorizontal(y, xAxis, yAxis, dashOn = 0, dashOff = 0) {
        if(!isContextAttached()) {
            console.error("Drawing requires an attached context");
            return self;
        }

        if(y >= yAxis.minimum() && y <= yAxis.maximum()) {
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
     * @param {number} x 
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @param {number} dashOn   // IN : positive integer for dashed line.  
     *                                  This is teh length of the dash, and if
     *                                  no dashOff is supplied, the length of 
     *                                  the gap. defaults to 0, no dash.
     * @param {number} dashOff  // IN : if a positive integer, then this is the
     *                                  length of the gap. defaults to zero,
     *                                  so dashOn is used for gap.
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function drawVertical(x, xAxis, yAxis, dashOn = 0, dashOff = 0) {
        if(!isContextAttached()) {
            console.error("Drawing requires an attached context");
            return self;
        }

        if(x >= xAxis.minimum() && x <= xAxis.maximum()) {
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
     * @param {AxisType} xAxis 
     * @param {AxisType} yAxis 
     * @param {CanvasTextAlign} align 
     * @param {CanvasTextBaseline} baseline 
     * @returns {LineChartType} // RET: this LineChart for fluent chain calls
     */
    function drawText(text, x, y, xAxis, yAxis, align = 'center', baseline = 'middle') {
        if(!isContextAttached()) {
            console.error("Drawing Chart text requires an attached context");
            return self;
        }

        if(x >= xAxis.minimum() && x <= xAxis.maximum()) {
            if((y >= yAxis.minimum()) && (y <= yAxis.maximum())) {
                const p0 = toCanvas(Point(x, y), xAxis, yAxis);
                _drawText(text, p0.x, p0.y, align, baseline);
            }
        }

        return self;
    }

    /**
     * Map a Point from axis coordinates to canvas coordinates
     * 
     * @param {Point2dType} pt   // IN : {x, y} in Axis coordinates
     * @param {AxisType} xAxis       // IN : horizontal Axis
     * @param {AxisType} yAxis       // IN : vertical Axis
     * @returns {Point2dType}    // RET: {x, y} in Canvas coordinates
     */
    function toCanvas(pt, xAxis, yAxis) {
        const x = int(map(pt.x, xAxis.minimum(), xAxis.maximum(), _left, _right - 1));
        const y = int(map(pt.y, yAxis.minimum(), yAxis.maximum(), _bottom - 1, _top));

        return Point(x, y);
    }

    /**
     * Map an (x,y) point from canvas coordinates to axis coordinates
     * 
     * @param {Point2dType} pt   // IN : {x, y} in Axis coordinates
     * @param {AxisType} xAxis       // IN : horizontal Axis
     * @param {AxisType} yAxis       // IN : vertical Axis
     * @returns {Point2dType}    // RET: {x, y} in Canvas coordinates
     */
    function toAxes(pt, xAxis, yAxis) {
        const x = map(pt.x, _left, _right - 1, xAxis.minimum(), xAxis.maximum());
        const y = map(pt.y, _bottom - 1, _top, yAxis.minimum(), yAxis.maximum());

        return Point(x, y);
    }

    /**
     * Draw a line on the chart.
     * 
     * @private
     * @param {Point2dType} p0 
     * @param {Point2dType} p1 
     */
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

    /**
     * Draw a point on the chart.
     * 
     * @private
     * @param {Point2dType} pt 
     */
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

    /**
     * Draw text on the chart.
     * 
     * @private
     * @param {string} text 
     * @param {number} x 
     * @param {number} y 
     * @param {CanvasTextAlign} align 
     * @param {CanvasTextBaseline} baseline 
     */
    function _drawText(text, x, y, align = 'center', baseline = 'middle') {
        _context.fillStyle = _textColor;
        _context.textAlign = align;
        _context.textBaseline = baseline;
        _context.fillText(text, x, y);
    }


    /**
     * Make sure the data iterator has hasNext() and next()
     * 
     * @param {Point2dIteratorType} dataIterator 
     */
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

    /** @type {LineChartType} */
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
        "drawPoint": drawPoint,
        "drawHorizontal": drawHorizontal,
        "drawVertical": drawVertical,
        "drawText": drawText,
    } 

    return self;
}

