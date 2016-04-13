"use strict";

var Checkpoint = require("./checkpoint");

class Device {

    /**
     * @typedef {Object} DeviceOptions
     * @property {string} id
     */

    /**
     * @param {DeviceOptions} deviceOptions
     */
    constructor(deviceOptions) {
        /**
         * @type {DeviceOptions}
         */
        this.deviceOptions = deviceOptions

        /**
         * @type {string}
         */
        this.deviceId = deviceOptions.id

        /**
         * @type {Array.<Checkpoint>}
         */
        this.checkpoints = [];

        /**
         * @type {Checkpoint}
         */
        this.unfinishedCheckpoint = this.newUnfinishedCheckpoint();
    }

    /**
     * @param {Step} step
     */
    addStep(step) {
        this.unfinishedCheckpoint.addSteps(step);
    }

    /**
     * @returns {Checkpoint}
     */
    newUnfinishedCheckpoint() {
        return new Checkpoint(-1, '#temp#')
    }

    /**
     * @param {Array.<Checkpoint>} checkpoints
     * @returns {Device}
     */
    addCheckpoints(checkpoints) {
        this.checkpoints = this.checkpoints.concat(checkpoints)
        return this
    }

    /**
     * @param {Checkpoint} checkpoint
     */
    addCheckpoint(checkpoint) {
        this.checkpoints.push(
            checkpoint.addSteps(this.unfinishedCheckpoint.steps)
        )
        this.unfinishedCheckpoint = this.newUnfinishedCheckpoint()
        return this
    }


    /**
     * @typedef {Object} DeviceJSON
     * @property {Object} deviceOptions
     * @property {Array.<Checkpoint>} checkpoints
     */

    /**
     * @return {DeviceJSON}
     */
    toJSON() {
        return {
            deviceOptions: this.deviceOptions,
            checkpoints: this.checkpoints
        }
    }

    /**
     * @param {DeviceJSON|string} json
     */
    static fromJSON(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        return (new Device(json.deviceOptions))
            .addCheckpoints(json.checkpoints.map(checkpointJSON => Checkpoint.fromJSON(checkpointJSON)))
    }
}

module.exports = Device
