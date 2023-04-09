// import RollbackState from "./rollback_state.js"
// import ViewValidationTools from "./view_validation_tools.js"

const ViewStateTools = function() {

    /**
     * Validate numeric value and update state.
     * 
     * @param {RollbackStateType} rollbackState // OUT: get's updated rollbackState.get(key) value
     * @param {string} key                  // IN : property name to update in rollbackState
     * @param {string} keyValid             // IN : if defined, name of boolean property in rollbackState
     *                                      //      that tracks if the state value is valid.
     * @param {number | string} value       // IN : updated value to validate and set if valid
     * @param {number} minValue             // IN : if defined, this is minimum allowed value inclusive
     * @param {number} maxValue             // IN : if defined, this is maximum allowed value inclusive
     * @returns {boolean}                   // RET: true if new valid is valid, false if invalid
     */
    function updateNumericState(
        rollbackState, key, keyValid, 
        value,                  // IN : new value for state
        minValue = undefined,   // IN : if a number, this is minimum valid value
        maxValue = undefined)   // IN : if a number, this is maximum valud value
    {
        const numericValue = ViewValidationTools.validateNumericInput(value, minValue, maxValue);
        if(typeof numericValue == "number") {
            // valid number within range
            rollbackState.setValue(key, numericValue);
            if(!!keyValid) rollbackState.setValue(keyValid, true);
            return true;
        } else {
            if(!!keyValid) rollbackState.setValue(keyValid, false);    // show as invalid
            return false;
        }
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {HTMLSelectElement} selectElement 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceSelectMenu(rollbackState, propertyName, selectElement, force = false) {
        //
        // enforce the select menu's value
        //
        if (force || rollbackState.isStaged(propertyName)) {
            if (selectElement) {
                selectElement.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }

        return false;
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {Element} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceText(rollbackState, propertyName, element, force = false) {
        //
        // enforce the text element's value
        //
        if (force || rollbackState.isStaged(propertyName)) {
            if (element) {
                element.textContent = rollbackState.commitValue(propertyName);
                return true;
            }
        }

        return false;
    }

    /**
     * Enforce state change to input element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {HTMLInputElement} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceInput(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    /**
     * Enforce state change to view element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {HTMLInputElement} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceCheck(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.checked = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    /**
     * Enforce the "invalid" class name on an element.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName name of boolean state property 
     *                              with value of true is valid, false is invalid
     * @param {Element} element element that gets 'invalid' class name 
     * @param {boolean} force optional; defaults to false
     *                        - true to force committing state,
     *                        - false to commit state only if it changed 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceValid(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                const valid = rollbackState.commitValue(propertyName);
                if(valid) {
                    element.classList.remove("invalid");
                } else {
                    element.classList.add("invalid");
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Enforce state change in range control's value;
     * make the view match the state.
     * 
     * @param {RollbackStateType} rollbackState 
     * @param {string} propertyName 
     * @param {HTMLInputElement} element 
     * @param {boolean} force 
     * @returns {boolean} true if enforced, false if not
     */
    function enforceRange(rollbackState, propertyName, element, force = false) {
        if(force || rollbackState.isStaged(propertyName)) {
            if(element) {
                element.value = rollbackState.commitValue(propertyName);
                return true;
            }
        }
        return false;
    }

    const self = {
        "enforceSelectMenu": enforceSelectMenu,
        "enforceText": enforceText,
        "enforceInput": enforceInput,
        "enforceCheck": enforceCheck,
        "enforceValid": enforceValid,
        "enforceRange": enforceRange,
        "updateNumericState": updateNumericState,
    }
    return self;
}();
