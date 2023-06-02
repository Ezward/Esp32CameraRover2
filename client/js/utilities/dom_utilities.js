//
///////////////// dom utilities //////////////
//

/**
 * Hide the element
 * @param {Element} el 
 */
const hide = el => {
    el.classList.add('hidden')
}

/**
 * show the element
 * @param {Element} el 
 */
const show = el => {
    el.classList.remove('hidden')
}

/**
 * disable the element
 * @param {Element} el 
 */
const disable = el => {
    el.classList.add('disabled')
    el.setAttribute('disabled', '')
}

/**
 * enable the element
 * @param {Element} el 
 */
const enable = el => {
    el.classList.remove('disabled')
    el.removeAttribute('disabled')
}

/**
 * determine if an html element has a value attribute.
 * 
 * @param {Element} el  // IN : html element
 * @returns {boolean}       // RET: true if element has a value attribute
 *                                  false if element does not have a value attribute
 */
const has_value = el => {
    return (el instanceof HTMLInputElement) || 
           (el instanceof HTMLSelectElement) ||
           (el instanceof HTMLMeterElement) ||
           (el instanceof HTMLProgressElement) ||
           (el instanceof HTMLButtonElement) ||
           (el instanceof HTMLOptionElement) ||
           (el instanceof HTMLLIElement);
}

/**
 * Set the value attribute of an element if the
 * element has one.
 * 
 * NOTE: only certain kinds of elements have a value
 *       attribute.  You can determine if the element
 *       has a value attribute by calling has_value().
 * 
 * @param {Element} el 
 * @param {any} value 
 */
const set_value = (el, value) => {
    if ((el instanceof HTMLInputElement) || 
        (el instanceof HTMLSelectElement) ||
        (el instanceof HTMLMeterElement) ||
        (el instanceof HTMLProgressElement) ||
        (el instanceof HTMLButtonElement) ||
        (el instanceof HTMLOptionElement) ||
        (el instanceof HTMLLIElement)) {
        el.value = value;
    }
}


/**
 * Get the value attribute of an element if the
 * element has one.
 * 
 * NOTE: only certain kinds of elements have a value
 *       attribute.  You can determine if the element
 *       has a value attribute by calling has_value().
 * 
 * @param {Element} el    // IN : the element
 * @returns {any | undefined} // RET: value if element has a value attribute
 *                                    or undefined if element does not have value attribute 
 */
const get_value = (el) => {
    if ((el instanceof HTMLInputElement) || 
        (el instanceof HTMLSelectElement) ||
        (el instanceof HTMLMeterElement) ||
        (el instanceof HTMLProgressElement) ||
        (el instanceof HTMLButtonElement) ||
        (el instanceof HTMLOptionElement) ||
        (el instanceof HTMLLIElement)) {
        return el.value
    }
    return undefined
}

/**
 * Determine if an html element has a checked attribute.
 * 
 * @param {Element} el 
 * @returns {boolean}
 */
const has_checked = (el) => {
    return (el instanceof HTMLInputElement && el.type == "checkbox")
}


/**
 * Get the checked attribute of an html element.
 * 
 * NOTE: only the input element of type 'checkbox' has
 *       a checked attribute.
 * 
 * @param {Element} el        // IN : the html element
 * @returns {boolean | undefined} // RET: if element is a checkbox, then the checked state,
 *                                //      if element is NOT a checkbox, then undefined.
 */
const get_checked = (el) => {
    if (el instanceof HTMLInputElement && el.type == "checkbox") {
        return el.checked
    }
    return undefined
}

/**
 * Set the checked attribute of an html element.
 * 
 * NOTE: only the input element of type 'checkbox' has
 *       a checked attribute.
 * 
 * @param {Element} el 
 * @param {boolean} checked 
 */
const set_checked = (el, checked) => {
    if (el instanceof HTMLInputElement && el.type == "checkbox") {
        el.checked = checked
    }
}
