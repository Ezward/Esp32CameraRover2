
/////////////////// utilities /////////////////
function assert(assertion) {
    if (true != assertion) {
        throw new Error("assertion failed");
    }
}

function constrain(value, min, max) {
    if (typeof value !== "number") throw new ValueError();
    if (typeof min !== "number") throw new ValueError();
    if (typeof max !== "number") throw new ValueError();
    if (min > max) throw new ValueError();

    if (value < min) return min;
    if (value > max) return max;
    return value;
}

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

function removeFirstFromList(list, element) {
    if (list) {
        const index = list.indexOf(element);
        if (index >= 0) {
            array.splice(index, 1);
        }
    }
}

function removeAllFromList(list, element) {
    if (list) {
        let index = list.indexOf(element);
        while (index >= 0) {
            array.splice(index, 1);
            index = list.indexOf(element, index);
        }
    }
}
