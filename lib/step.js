"use strict";


/**
 * @param {string} deviceId
 * @param {number} step
 * @param {string} command
 * @param {Buffer} image
 * @constructor
 */
function Step(deviceId, step, command, image) {
    this.deviceId = deviceId;
    this.step = step;
    this.command = command;
    this.image = image;
}

/**
 * @param {string|object} json
 * @returns {Step}
 */
Step.parse = function(json) {
    if (typeof json === 'string') {
        json = JSON.parse(json);
    }
    return new Step(json.deviceId, json.step, json.command, json.image);
}

/**
 * @returns {string}
 */
Step.prototype.toJson = function() {
    return {
        'deviceId': this.deviceId,
        'step': this.step,
        'command': this.command,
        'image': this.image.toString()
    };
}

module.exports = Step;
