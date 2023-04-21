
/////////////////// utilities /////////////////

/**
 * Validate that assertion is true or throw an Error().
 * 
 * @param {boolean} assertion 
 * @throws {Error} // EXC: if assertion is false
 */
function assert(assertion) {
    if (true != assertion) {
        throw new Error("assertion failed");
    }
}

/**
 * Absolute value of a number.
 * 
 * @param {number} x 
 * @returns {number}
 * @throws {TypeError} // EXC: If x is not a number type.
 */
function abs(x) {
    if("number" !== typeof x) throw new TypeError();
    return (x >= 0) ? x : -x;
}

/**
 * Coerce a number to an integer.
 * 
 * @param {number} x 
 * @returns {number}   // RET: integer number
 * @throws {TypeError} // EXC: if x is not a number type.
 */
function int(x) {
    if("number" !== typeof x) throw new TypeError();
    return x | 0;
}

/**
 * Get maximum of two numeric values.
 * 
 * @param {number} x 
 * @param {number} y
 * @returns {number}   // RET: maximum of x and y 
 * @throws {TypeError} // EXC: if argument is not a number type.
 */
function max(x, y) {
    if("number" !== typeof x) throw new TypeError();
    if("number" !== typeof y) throw new TypeError();
    return (x >= y) ? x : y;
}

/**
 * Get minium of two numeric values.
 * 
 * @param {number} x 
 * @param {number} y
 * @returns {number}   // RET: minimum of x and y 
 * @throws {TypeError} // EXC: if argument is not a number.
 */
function min(x, y) {
    if("number" !== typeof x) throw new TypeError();
    if("number" !== typeof y) throw new TypeError();
    return (x < y) ? x : y;
}

/**
 * Validate a value is a number and optionally falls within an range.
 * 
 * @param {number} value         // IN : numeric value to validate
 * @param {number|undefined} min // IN : if a number, then this is minimum valid value inclusive
 *                               //      if undefined then no minimum check is made
 * @param {number|undefined} max // IN : if a number, then this is maximum valid value inclusive
 *                               //      if undefined then no maximum check is made
 * @param {boolean} exclusive    // IN : true if range is exclusive, false if inclusive.
 *                               //      default is false (inclusive)
 * @returns {boolean}            // RET: true if valid and within range, false otherwise
 */
function isValidNumber(value, min = undefined, max = undefined, exclusive = false) {
    // must be a number
    let valid = (typeof value === "number");
    
    // must be at or above min if there is a min
    valid = valid && 
        ((typeof min === "undefined") || 
         ((typeof min === "number") && exclusive ? (value > min) : (value >= min)));
    
    // must be at or below max if there is a max
    valid = valid && 
        ((typeof max === "undefined") || 
         ((typeof max == "number") && exclusive ? (value < max) : (value <= max)));
    
    return valid;
}

/**
 * constrain a value to a range.
 * - if the value is < min, then it becomes the min.
 * - if the value > max, then it becomes the max.
 * - otherwise it is unchanged.
 * 
 * @param {number} value // IN : value to constrain
 * @param {number} min   // IN : minimum value inclusive
 * @param {number} max   // IN : maximum value inclusive
 * @returns {number}     // RET: min <= number <= max
 * @throws {TypeError}   // EXC: if argument is not a number.
 */
function constrain(value, min, max) {
    if (typeof value !== "number") throw new TypeError();
    if (typeof min !== "number") throw new TypeError();
    if (typeof max !== "number") throw new TypeError();
    if (min > max) throw new Error();

    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/**
 * map a value in one range to another range
 * 
 * @param {number} value 
 * @param {number} fromMin 
 * @param {number} fromMax 
 * @param {number} toMin 
 * @param {number} toMax 
 * @returns {number}
 * @throws {TypeError} // EXC: if an argument is not a number
 */
function map(value, fromMin, fromMax, toMin, toMax) {
    if (typeof value !== "number") throw new TypeError();
    if (typeof fromMin !== "number") throw new TypeError();
    if (typeof fromMax !== "number") throw new TypeError();
    if (typeof toMin !== "number") throw new TypeError();
    if (typeof toMax !== "number") throw new TypeError();

    const fromRange = fromMax - fromMin;
    const toRange = toMax - toMin;
    return (value - fromMin) * toRange / fromRange + toMin
}

/**
 * create a new list by keeping all elements in the original list
 * that return true when passed to the given filterFunction
 * and discarding all other elements.
 *
 * NOTE: This is safe to use on result of document.querySelectorAll(),
 *       which does not have a filter() method.
 * 
 * @param {any[]} list 
 * @param {(any) => boolean} filterFunction 
 * @returns {any[]}
 */
function filterList(list, filterFunction) {
    var elements = [];

    // Loop through each element, apply filter and push to the array
    if (typeof filterFunction === "function") {
        for (let i = 0; i < list.length; i += 1) {
            const element = list[i];
            if (filterFunction(element)) {
                elements.push(element);
            }
        }
    }
    return elements;
}

/*
** remove the first matching element from the list
*/
/**
 * Remove the first matching element from the list.
 * 
 * @param {any[]} list  // IN : list of elements
 *                      // OUT: list with element removed
 * @param {any} element // IN : element to remove
 * @returns {void}
 */
function removeFirstFromList(list, element) {
    if (list) {
        const index = list.indexOf(element);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }
}

/**
 * Remove all matching elements from the list.
 * 
 * @param {any[]} list  // IN : list of elements
 *                      // OUT: list with all matching elements removed
 * @param {any} element // IN : element to remove
 * @returns {void}
 */
function removeAllFromList(list, element) {
    if (list) {
        let index = list.indexOf(element);
        while (index >= 0) {
            list.splice(index, 1);
            index = list.indexOf(element, index);
        }
    }
}
