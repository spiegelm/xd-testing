"use strict";


/**
 * @param {string} deviceId
 * @param {number} step
 * @param {string|Array.<string>} command
 * @param {Buffer} image
 * @param deviceOptions
 * @constructor
 */
function Step(deviceId, step, command, image, deviceOptions) {

    if (!(image instanceof Buffer)) {
        throw new Error('image must be of type Buffer');
    }

    this.deviceId = deviceId;
    this.step = step;
    this.commands = Array.isArray(command) ? command : [command];
    this.image = image;
    this.deviceOptions = deviceOptions || {};
}

/**
 * @param {string|object} json
 * @returns {Step}
 */
Step.fromJson = function(json) {
    if (typeof json === 'string') {
        json = JSON.parse(json);
    }
    return new Step(json.deviceId, json.step, json.commands, new Buffer(json.image, 'base64'), this.options);
}

/**
 * @returns {string}
 */
Step.prototype.toJson = function() {
    return {
        'deviceId': this.deviceId,
        'step': this.step,
        'commands': this.commands,
        'image': this.image.toString('base64')
    };
}

module.exports = Step;
