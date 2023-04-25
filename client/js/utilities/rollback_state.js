
/**
 * Key/Value store where values can be staged
 * and then committed or rolled back.
 * Staged values can be used as a 'diff' 
 * between a new state and the prior state.
 * ```
 *   let state = RollbackState();
 *   state.setValue("foo", "bar");
 *   let value = state.getValue("foo");
 * ```
 * 
 * @typedef {Object} RollbackStateType
 * @property {(key: string) => boolean} isStaged
 * @property {(key: string) => boolean} isCommitted
 * @property {(key: string) => boolean} isUncommitted
 * @property {(key: string) => boolean} hasValue
 * @property {(key: string, value: any) => void} setValue
 * @property {(key: string) => any} getValue
 * @property {(key: string, value: any) => void} setStagedValue
 * @property {(key: string) => any} getStagedValue
 * @property {() => string[]} getStagedKeys
 * @property {(key: string) => boolean} isStaged
 * @property {(key: string) => boolean} isCommitted
 * @property {(key: string) => boolean} hasValue
 * @property {(key: string) => boolean} isUncommitted
 * @property {(key: string) => any} getCommittedValue
 * @property {() => string[]} getCommittedKeys
 * @property {(key: string) => any} commitValue
 * @property {() => void} commit
 * @property {(key: string) => void} rollbackValue
 * @property {() => void} rollback
 * @property {() => void} reset
 * @property {(key: string, value: any) => void} setValue
 * @property {(key: string) => any} getValue
 * @property {() => string[]} getKeys
 * @property {() => object} getCopy
 */

/**
 * Construct a RollbackState instance.
 * 
 * @param {object} defaultState
 * @returns {RollbackStateType}
 */
const RollbackState = (defaultState = {}) => {
    const baseState = { ...defaultState }; // default committed state
    let committed = { ...defaultState }; // committed state
    let staged = {}; // newly staged state

    /**
     * Validated key is a non-empty string
     * 
     * @param {string} key 
     */
    const _assertKey = function (key) {
        if ((typeof key !== "string") || ("" === key)) {
            throw TypeError()
        }
    }

    /**
     * Stage the value if it has changed.
     * 
     * @param {string} key 
     * @param {any} value 
     */
    const setStagedValue = function (key, value) {
        _assertKey(key);
        staged[key] = value;
    }

    /**
     * Get a staged value.
     * 
     * @param {string} key 
     * @returns {any}
     */
    const getStagedValue = function (key) {
        _assertKey(key);
        return staged[key];
    }

    /**
     * Get the keys of all staged values.
     * 
     * @returns {string[]}
     */
    const getStagedKeys = function () {
        return Object.keys(staged);
    }

    /**
     * Determine if a key has a staged value.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    const isStaged = function (key) {
        _assertKey(key);
        return staged.hasOwnProperty(key);
    }

    /**
     * Determine if a key has a committed value.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    const isCommitted = function (key) {
        _assertKey(key);
        return committed.hasOwnProperty(key);
    }

    /**
     * Determine if the key is in the state
     * as either a staged or committed.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    const hasValue = function (key) {
        _assertKey(key);
        return isStaged(key) || isCommitted(key);
    }

    /**
     * Determine if a key has a staged value, but
     * has no prior committed value.  
     * In otherwords, determine if this
     * is a new state value.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    const isUncommitted = function (key) {
        _assertKey(key);
        return staged.hasOwnProperty(key) &&
            !committed.hasOwnProperty(key);
    }


    /**
     * Get a committed value.
     * 
     * @param {string} key 
     * @returns {any}
     */
    const getCommittedValue = function (key) {
        _assertKey(key);
        return committed[key];
    }

    /**
     * Get the keys for all commited values.
     * 
     * @returns {string[]}
     */
    const getCommittedKeys = function () {
        return Object.keys(committed);
    }

    //
    // commit any staged value and 
    // return the committed value
    //
    /**
     * Commit a valueand return it.
     * 
     * @param {string} key 
     * @returns {any}
     */
    const commitValue = function (key) {
        _assertKey(key);
        if (isStaged(key)) {
            committed[key] = staged[key];
            delete staged[key];
        }
        return committed[key];
    }

    /**
     * Commit all staged values by moving 
     * into commited values and clearing the stage.
     * 
     * @returns {void}
     */
    const commit = function () {
        for (const key in staged) {
            committed[key] = staged[key];
        }
        staged = {};
    }

    /**
     * Rollback a a staged value.
     * 
     * @param {string} key 
     * @returns {void}
     */
    const rollbackValue = function (key) {
        _assertKey(key);
        delete staged[key];
    }

    /**
     * Rollback all staged values.
     * 
     * @returns {void}
     */
    const rollback = function () {
        staged = {};
    }

    /**
     * Reset the committed state to the initial values
     * and clear the staged state.
     * 
     * @returns {void}
     */
    const reset = function () {
        staged = {};
        committed = { ...baseState
        };
    }

    /**
     * Set and stage a value.  
     * Note: the value is only staged if the set value
     *       differs from the current value as returned
     *       by getValue()
     * 
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    const setValue = function (key, value) {
        _assertKey(key);
        if (value !== getValue(key)) {
            staged[key] = value;
        }
    }


    /**
     * Get a value from the state;
     * - if staged, returned staged value
     * - if committed, return committed value
     * - otherwise return undefined
     * 
     * @param {string} key non-empty string
     * @returns {any}
     */
    const getValue = function (key) {
        _assertKey(key);
        if (isStaged(key)) {
            return staged[key];
        }
        return committed[key];
    }

    /**
     * Return the keys of values in the state.
     * This list of keys can be used to iterate
     * all values in the state.
     * For example:
     * ```
     *   const keys = getKeys();
     *   for(let i = 0; i < keys.length; i += 1) {
     *     const value = getValue(key);
     *   }
     * ```
     * @returns {string[]}
     */
    const getKeys = function () {
        return getCopy().keys();
    }

    /**
     * Return a shallow copy of the state
     * that includes staged and committed values.
     * 
     * @returns {object}
     */
    const getCopy = function () {
        return { ...staged, ...committed };
    }

    /** @type {RollbackStateType} */
    const self = Object.freeze({
        "isStaged": isStaged,
        "isCommitted": isCommitted,
        "isUncommitted": isUncommitted,
        "hasValue": hasValue,
        "setValue": setValue,
        "getValue": getValue,
        "setStagedValue": setStagedValue,
        "getStagedValue": getStagedValue,
        "getCommittedValue": getCommittedValue,
        "getStagedKeys": getStagedKeys,
        "getCommittedKeys": getCommittedKeys,
        "getKeys": getKeys,
        "commitValue": commitValue,
        "commit": commit,
        "rollbackValue": rollbackValue,
        "rollback": rollback,
        "reset": reset,
        "getCopy": getCopy,
    });

    return self;
}
