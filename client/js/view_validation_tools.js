/**
 * Validate values pulled from DOM.
 */
const ViewValidationTools = function() {
    /**
     * Validate text as a number in the given range.
     * 
     * @param {string | number} value 
     * @param {number} minValue 
     * @param {number} maxValue 
     * @return {number | undefined}
     */
    function validateNumericInput(
        value,                  // IN : text to validate as a number
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
                                // RET: if valid, the number
                                //      if invalid, undefined
    {
        //
        // check input type
        //
        let numericValue = undefined
        if (typeof value == "string") {
            numericValue = parseFloat(value);
        } else if (typeof value == "number") {
            numericValue = value
        } else {
            console.log("Value that is not a string or number cannot be validated and is ignored.");
            return undefined
        }

        if (isNaN(numericValue)) return undefined;
        if ((typeof minValue == "number") && (numericValue < minValue)) return undefined;
        if ((typeof maxValue == "number") && (numericValue > maxValue)) return undefined;
        return numericValue;
    }

    const self = {
        "validateNumericInput": validateNumericInput,
    }

    return self;
}();