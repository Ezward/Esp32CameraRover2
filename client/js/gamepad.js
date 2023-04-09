///////////////// Gamepad Utilities ////////////////
/**
 * @typedef {object} GamepadMapperType
 * @property {(gamepads: Gamepad[]) => Gamepad[]} connectedGamePads
 * @property {(buttonValue: number, start: number, end: number) => number} mapButtonRange
 * @property {(axisValue: number, start: number, end: number) => number} mapAxisRange
 * @property {(gamepads: any, gamePadIndex: number, axesOfInterest: number[], buttonsOfInterest: number[]) => {axes: number[], buttons: number[]}} mapGamePadValues
 */

/**
 * Construct a game pad mapper instance.
 * 
 * @returns {GamepadMapperType}
 */
function GamepadMapper() {

    /**
     * filter list of gamepads and return
     * only connected gamepads.
     * 
     * @param {Gamepad[]} gamepads  // IN : list of Gamepad from navigator.getGamepads()
     * @returns {Gamepad[]}         // RET: list of connected Gamepads
     */
    function connectedGamePads(gamepads) {
        /** @type {Gamepad[]} */
        const connected = []
        if (gamepads && gamepads.length) {
            for (let i = 0; i < gamepads.length; i += 1) {
                const gamepad = gamepads[i];
                if (gamepad && gamepad.connected) {
                    connected.push(gamepad);
                }
            }
        }
        return connected;
    }


    /**
     * Map a button value of 0.0 to 1.0 to given range.
     * 
     * @param {number} buttonValue, between 0.0 and 1.0
     * @param {number} start, range start inclusive (start may be >= end)
     * @param {number} end, range end includes (end may be <= start)
     * @returns {number} in range of start to end inclusive
     */
    function mapButtonRange(buttonValue, start, end) {
        if (typeof buttonValue !== "number") throw new TypeError();
        if (typeof start !== "number") throw new TypeError();
        if (typeof end !== "number") throw new TypeError();

        //
        // map button's value of 0.0 to 1.0
        // to range start to end
        //
        return buttonValue * (end - start) + start;
    }


    /**
     * Map an axis value of -1.0 to 1.0 to given range.
     * 
     * @param {number} axisValue, between -1.0 and 1.0
     * @param {number} start, range start inclusive (start may be >= end)
     * @param {number} end, range end includes (end may be <= start)
     * @returns {number} in range of start to end inclusive
     */
    function mapAxisRange(axisValue, start, end) {
        if (typeof axisValue !== "number") throw new TypeError();
        if (typeof start !== "number") throw new TypeError();
        if (typeof end !== "number") throw new TypeError();

        //
        // map axis' value of -1.0 to 1.0
        // to range start to end
        //
        return ((axisValue + 1) / 2) * (end - start) + start;
    }


    /**
     * Get values of buttons and axes of interest for the requested gamepad.
     * The order of returned values is the same as the order of the indices
     * in the array arguments; so the caller can create a mapping by
     * deciding which values and in what order they should be returned.
     * 
     * @param {number} gamePadIndex        : index of gamePad in array of gamePads returned by navigator.getGamepads()
     * @param {number[]} axesOfInterest    : list of indices of the axis to read (returned in this order)
     * @param {number[]} buttonsOfInterest : list of indices of the buttons to read (returned in this order)
     * @return {{axes: number[], buttons: number[]}} value axes and buttons requested in specified 
     *                                               in axesOfInterest and buttonsOfInterest;
     *                                               value is 0.0 to 1.0 for buttons,
     *                                               value is -1.0 to 1.0 for axes 
     */
    function mapGamePadValues(gamepads, gamePadIndex, axesOfInterest, buttonsOfInterest) {
        let state = {
            /** @type {number[]} */
            axes: [],

            /** @type {number[]} */
            buttons: []
        };

        if (gamepads && (gamepads.length > 0)) {
            const gamepad = gamepads[gamePadIndex];
            if (gamepad) {
                for (let i = 0; i < axesOfInterest.length; i += 1) {
                    const axesIndex = axesOfInterest[i];
                    state.axes.push(gamepad.axes[axesIndex]);
                }
                for (let i = 0; i < buttonsOfInterest.length; i += 1) {
                    const buttonIndex = buttonsOfInterest[i];
                    state.buttons.push(gamepad.buttons[buttonIndex]);
                }
            }
        }

        return state;
    }

    /** @type {GamepadMapperType} */
    const self = {
        "mapGamePadValues": mapGamePadValues,
        "mapAxisRange": mapAxisRange,
        "mapButtonRange": mapButtonRange,
        "connectedGamePads": connectedGamePads,
    }

    return self;
}
