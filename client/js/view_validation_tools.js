
const ViewValidationTools = function() {
    /**
     * Validate text as a number in the given range.
     * 
     * @param {string} textValue 
     * @param {number} minValue 
     * @param {number} maxValue 
     */
    function validateNumericInput(
        textValue,              // IN : text to validate as a number
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
                                // RET: if valid, the number
                                //      if invalid, undefined
    {
        if(!textValue) return undefined;

        const numericValue = parseFloat(textValue);
        if (isNaN(numericValue)) return undefined;
        if ((typeof minValue == "number") && (numericValue < minValue)) return undefined;
        if ((typeof maxValue == "number") && (numericValue > maxValue)) return undefined;
        return numericValue;
    }

    const exports = {
        "validateNumericInput": validateNumericInput,
    }

    return exports;
}();