/// <reference path="../utilities/rollback_state.js" />

/**
 * Singleton with function that help 
 * in maintain view elements.
 */
const ViewWidgetTools = (function() {
    /**
     * Increment a range input element's state.
     * 
     * @param {RollbackStateType} state     // state bound to range control
     * @param {string} parameter        // name of state parameter
     * @param {string} parameterLive    // name of live update state parameter
     * @param {number} increment        // range's increment value
     * @param {number} maxRange         // range's maximum allowed value
     * @param {number} decimals         // number of decimals to show in value
     */
    function onRangeIncrement(state, parameter, parameterLive, increment, maxRange, decimals) {
        // update state to cause a redraw on game loop
        let value = state.getValue(parameter);
        if((typeof value == "number") && (value <= (maxRange - increment)))
        {
            value = constrain(parseFloat((value + increment).toFixed(decimals)), 0, 1);
            state.setValue(parameter, value);
            state.setValue(parameterLive, value);
        }
    }

    /**
     * Decrement a range input element's state.
     * 
     * @param {RollbackStateType} state     // state bound to range control
     * @param {string} parameter        // name of state parameter
     * @param {string} parameterLive    // name of live update state parameter
     * @param {number} increment        // range's increment value
     * @param {number} minRange         // range's minimum allowed value
     * @param {number} decimals         // number of decimals to show in value
     */
    function onRangeDecrement(state, parameter, parameterLive, increment, minRange, decimals) {
        // update state to cause a redraw on game loop
        let value = state.getValue(parameter);
        if((typeof value == "number") && (value >= (minRange + increment)))
        {
            value = constrain(parseFloat((value - increment).toFixed(decimals)), 0, 1);
            state.setValue(parameter, value);
            state.setValue(parameterLive, value);
        }
    }

    /**
     * Clear all the select menu options.
     * 
     * @param {HTMLSelectElement} select 
     */
    function clearSelectOptions(select) {
        if (select) {
            while (select.options.length > 0) {
                select.remove(0);
            }
        }
    }

    const exports = Object.freeze({
        "onRangeIncrement": onRangeIncrement,
        "onRangeDecrement": onRangeDecrement,
        "clearSelectOptions": clearSelectOptions,
    });

    return exports;
}());