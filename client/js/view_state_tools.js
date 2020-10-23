
const ViewStateTools = function() {
    /**
     * Enforce state change to view element.
     * 
     * @param {object} rollbackState 
     * @param {string} propertyName 
     * @param {Element} selectElement 
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
     * @param {object} rollbackState 
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
     * @param {object} rollbackState 
     * @param {string} propertyName 
     * @param {Element} element 
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
     * @param {object} rollbackState 
     * @param {string} propertyName 
     * @param {Element} element 
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
     * @param {object} rollbackState 
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


    exports = {
        "enforceSelectMenu": enforceSelectMenu,
        "enforceText": enforceText,
        "enforceInput": enforceInput,
        "enforceCheck": enforceCheck,
        "enforceValid": enforceValid
    }
    return exports;
}();
