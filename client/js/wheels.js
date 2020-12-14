
// global constants
const LEFT_WHEEL = "left";
const RIGHT_WHEEL = "right";
const LEFT_WHEEL_INDEX = 0;
const RIGHT_WHEEL_INDEX = 1;
const LEFT_WHEEL_ID = (0x01 << LEFT_WHEEL_INDEX);
const RIGHT_WHEEL_ID = (0x01 << RIGHT_WHEEL_INDEX);

/**
 * Singleton to lookup name of wheels.
 */
const Wheels = (function() {
    const WHEEL_INDEX = {
        "left": 0,
        "right": 1
    };
    const WHEEL_NAME = [
        "left",
        "right"
    ];
    const WHEEL_ID = [
        0x01,
        0x02
    ]

    function count() {
        return WHEEL_NAME.length;
    }

    function name(wheelIndex) {
        return WHEEL_NAME[wheelIndex];
    }

    function index(wheelName) {
        return WHEEL_INDEX[wheelName];
    }

    function id(wheelName) {
        return WHEEL_ID[wheelName];
    }

    self = {
        "name": name,
        "index": index,
        "id": id,
        "count": count,
    };

    return self;
})();