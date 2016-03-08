"use strict";

/**
 *
 * @param {MultiDevice} multiDevice
 * @returns {getCount}
 */
module.exports = (multiDevice) => {

    /**
     * @param {Function} callback
     */
    return function sequentialCommand(callback) {
        return callback();
    }
};
