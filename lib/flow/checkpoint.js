"use strict";

var Step = require("./step");

class Checkpoint {

    /**
     * @param {string} id
     * @param {string} name
     */
    constructor(id, name) {
        /**
         * @type {string}
         */
        this.id = id

        /**
         * @type {string}
         */
        this.name = name

        /**
         * @type {Array.<Step>}
         */
        this.steps = []
    }

    /**
     * @param {Array.<Step>} steps
     * @returns {Checkpoint}
     */
    addSteps(steps) {
        this.steps = this.steps.concat(steps);
        return this;
    }


    /**
     * @typedef {Object} CheckpointJSON
     * @property {number} id
     * @property {string} name
     * @property {Array.<StepJSON>} steps
     */

    /**
     * @returns {CheckpointJSON}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            steps: this.steps
        }
    }

    /**
     *
     * @param {CheckpointJSON|string} json
     * @returns {Checkpoint}
     */
    static fromJSON(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        return (new Checkpoint(json.id, json.name)).addSteps(json.steps.map(stepJSON => Step.fromJSON(stepJSON)))
    }

}

module.exports = Checkpoint;
