
/////////////////// utilities /////////////////
function assert(assertion) {
    if (true != assertion) {
        throw new Error("assertion failed");
    }
}

/*
** constrain a value to a range.
** if the value is < min, then it becomes the min.
** if the value > max, then it becomes the max.
** otherwise it is unchanged.
*/
function constrain(value, min, max) {
    if (typeof value !== "number") throw new ValueError();
    if (typeof min !== "number") throw new ValueError();
    if (typeof max !== "number") throw new ValueError();
    if (min > max) throw new ValueError();

    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/*
** map a value in one range to another range
*/
function map(value, fromMin, fromMax, toMin, toMax) {
    if (typeof value !== "number") throw new ValueError();
    if (typeof fromMin !== "number") throw new ValueError();
    if (typeof fromMax !== "number") throw new ValueError();
    if (typeof toMin !== "number") throw new ValueError();
    if (typeof toMax !== "number") throw new ValueError();

    const fromRange = fromMax - fromMin;
    const toRange = toMax - toMin;
    return (value - fromMin) * toRange / fromRange + toMin
}

/*
** create a new list by keeping all elements in the original list
** that return true when passed to the given filterFunction
** and discarding all other elements.
*/
function filterList(list, filterFunction) {
    var elements = [];

    // Loop through each element, apply filter and push to the array
    if (filterFunction) {
        for (let i = 0; i < list.length; i += 1) {
            const element = list[i];
            if (filterFunction(element)) {
                elements.push(sibling);
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
