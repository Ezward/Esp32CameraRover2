
/////////////////// utilities /////////////////
function assert(assertion) {
    if (true != assertion) {
        throw new Error("assertion failed");
    }
}

/*
** absolute value of a number
*/
function abs(x) {
    if("number" !== typeof x) throw new TypeError();
    return (x >= 0) ? x : -x;
}

/*
** coerce number to an integer
*/
function int(x) {
    if("number" !== typeof x) throw new TypeError();
    return x | 0;
}

/**
 * Validate a value is a number and optionally
 * falls within an range.
 * 
 * @param {number} value         // IN : numeric value to validate
 * @param {number|undefined} min // IN : if a number, then this is minimum valid value inclusive
 *                               //      if undefined then no minimum check is made
 * @param {number|undefined} max // IN : if a number, then this is maximum valid value inclusive
 *                               //      if undefined then no maximum check is made
 * @param {boolean} exclusive    // IN : true if range is exclusive, false if inclusive.
 *                               //      default is false (inclusive)
 */
function isValidNumber(value, min = undefined, max = undefined, exclusive = false) {
    if(typeof value === "number") 
    {
        if((typeof min === "undefined") || 
           ((typeof min === "number") && exclusive ? (value > min) : (value >= min))) 
        {
            if((typeof max === "undefined") || 
               ((typeof max == "number") && exclusive ? (value < max) : (value <= max))) 
            {
                return true;
            }
        }
    }
    return false;
}

/*
** constrain a value to a range.
** if the value is < min, then it becomes the min.
** if the value > max, then it becomes the max.
** otherwise it is unchanged.
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

/*
** map a value in one range to another range
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

/*
** create a new list by keeping all elements in the original list
** that return true when passed to the given filterFunction
** and discarding all other elements.
**
** NOTE: This is safe to use on result of document.querySelectorAll(),
**       which does not have a filter() method.
*/
function filterList(list, filterFunction) {
    var elements = [];

    // Loop through each element, apply filter and push to the array
    if (filterFunction) {
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
function removeFirstFromList(list, element) {
    if (list) {
        const index = list.indexOf(element);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }
}

/*
** remove all matching elements from the list
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
