"use strict";


/**
 * @param {string} deviceId
 * @param {number} number
 * @param {string|Array.<string>} command
 * @param {Buffer} image
 * @param {object} [deviceOptions]
 * @param {boolean} [isCheckpoint]
 * @constructor
 */
function Step(deviceId, number, command, image, deviceOptions, isCheckpoint) {

    if (!(image instanceof Buffer)) {
        throw new Error('image must be of type Buffer');
    }

    this.deviceId = deviceId;
    this.stepIndex = number;
    this.commands = Array.isArray(command) ? command : [command];
    this.image = image;
    this.deviceOptions = deviceOptions || {};
    this.isCheckPoint = isCheckpoint || false;
}

/**
 * @param {string|object} json
 * @returns {Step}
 */
Step.fromJson = function (json) {
    if (typeof json === 'string') {
        json = JSON.parse(json);
    }
    return new Step(json.deviceId, json.stepIndex, json.commands, new Buffer(json.image, 'base64'), json.options, json.isCheckpoint);
}

/**
 * @returns {string}
 */
Step.prototype.toJson = function () {
    return {
        'deviceId': this.deviceId,
        "stepIndex": this.stepIndex,
        'commands': this.commands,
        'image': this.image.toString('base64'),
        'deviceOptions': this.deviceOptions,
        'isCheckpoint': this.isCheckPoint
    };
}

module.exports = Step;
