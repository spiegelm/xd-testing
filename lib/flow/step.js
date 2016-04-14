"use strict";

class Step {

    /**
     * @param {number} stepId
     * @param {string|Array.<string>} command
     * @param {Buffer|null} image
     * @constructor
     */
    constructor(stepId, command, image) {

        if (!(image instanceof Buffer || image === null)) {
            throw new Error('image must be instance of Buffer or null');
        }

        /**
         * @type {number}
         */
        this.stepId = stepId;

        /**
         * @type {Array.<string>}
         */
        this.commands = Array.isArray(command) ? command : [command];

        /**
         * @type {Buffer|null}
         */
        this.image = image;
    }

    /**
     * @returns {String}
     */
    get imageBase64() {
        return this.image !== null ? this.image.toString('base64') : null
    }

    /**
     * @typedef {Object} StepJSON
     * @property {number} stepId
     * @property {string} image
     * @property {Array.<string>} commands
     */

    /**
     * @param {string|StepJSON} json
     * @returns {Step}
     */
    static fromJSON(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json)
        }
        return new Step(json.stepId, json.commands, json.image ? new Buffer(json.image, 'base64') : null)
    }

    /**
     * @return {StepJSON}
     */
    toJSON() {
        return {
            stepId: this.stepId,
            commands: this.commands,
            image: this.image ? this.image.toString('base64') : null
        };
    }


}

module.exports = Step;
