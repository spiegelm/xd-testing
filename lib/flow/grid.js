"use strict";

var Checkpoint = require("./checkpoint");

class Grid {

    /**
     * @param {Array.<Device>} devices
     */
    constructor (devices) {
        /**
         * @type {Flow}
         */
        this.deviceArray = devices

        /**
         * @type {Array.<GridRow>}
         */
        this.rows = this.generateGrid()
    }

    /**
     * @typedef {Object} GridRow
     * @property {string} name
     * @property {Array.<Checkpoint>} checkpoints
     */

    /**
     * @returns {Array.<GridRow>}
     */
    generateGrid() {
        /**
         * @type {Array.<GridRow>}
         */
        let rows = []

        /**
         * @type {Array.<Checkpoint>}
         */
        let checkpointById = []

        /**
         * Maps deviceIds to numerical indices
         * @type {Object.<string, number>}
         */
        let deviceIndex = {}

        this.deviceArray.forEach((device, index) => {
            deviceIndex[device.deviceId] = index
            device.checkpoints.forEach(checkpoint => {
                checkpoint.deviceId = device.deviceId
                checkpointById[checkpoint.id] = checkpoint
            })
        })

        // Assemble checkpoints into rows
        checkpointById.forEach(checkpoint => {
            // TODO verify this approach works for all cases
            // e.g. two devices working in parallel to two other devices

            if (rows.length > 0 && rows[rows.length - 1].name == checkpoint.name) {
                // Add checkpoint to existing row
                rows[rows.length - 1].checkpoints[deviceIndex[checkpoint.deviceId]] = checkpoint
            } else {
                // New checkpoint name - new row
                let checkps = []
                checkps[deviceIndex[checkpoint.deviceId]] = checkpoint
                rows.push({name: checkpoint.name, checkpoints: checkps})
            }
        })

        // Fill undefined slots with empty checkpoint
        rows.forEach(row => {
            let indices = Object.keys(row.checkpoints).sort()
            let max = Math.max.apply(null, indices)

            for (let i = 0; i <= max; i++) {
                if (row.checkpoints[i] === undefined) {
                    row.checkpoints[i] = new Checkpoint(-1, row.name)
                }
                // Only keep the last image for each checkpoint
                let steps = row.checkpoints[i].steps
                let foundImage = false
                for (let s = steps.length - 1; s >= 0; s--) {
                    if (foundImage) {
                        steps[s].image = null
                    }
                    if (steps[s].image !== null) {
                        foundImage = true
                    }
                }
            }
        })

        return rows
    }
}

module.exports = Grid
