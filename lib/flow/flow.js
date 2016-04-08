"use strict";

var fs = require("fs");
var Step = require("./step");
var Device = require("./device");
var Checkpoint = require("./checkpoint");

/**
 * @template T
 * @param {T} obj
 * @returns {T}
 */
function objectOrThrowError(obj) {
    if (!obj) {
        throw new Error('device not found')
    }
    return obj
}

class Flow {

    constructor() {
        /**
         * @type {Array.<Device>}
         */
        this.devices = [];
    }

    /**
     * @param {Array.<Device>} devices
     * @returns {Flow}
     */
    addDevices(devices) {
        this.devices = this.devices.concat(devices)
        return this
    }

    /**
     * @param {string} deviceId
     * @returns {Device}
     */
    device(deviceId) {
        return objectOrThrowError(this.devices.find(device => device.deviceId === deviceId))
    }

    /**
     * @param {number} id
     * @returns {Device}
     */
    checkpoint(id) {
        return objectOrThrowError(this.devices.find(device =>
            device.checkpoints.find(checkpoint =>
                checkpoint.id === id
            )))
    }

    /**
     * @param {number} id
     * @returns {Step}
     */
    step(id) {
        return objectOrThrowError(this.devices.find(device =>
            device.checkpoints.find(checkpoint =>
                checkpoint.steps.find(step =>
                    step.id === id
                ))))
    }

    ///**
    // * @returns {Flow}
    // */
    //fixCommandAlignment() {
    //    // align steps for each device
    //    let alignedDeviceSteps = this.devices().map(id => {
    //        let alignedSteps = this.deviceSteps(id)
    //        if (alignedSteps.length === 0) {
    //            return [];
    //        }
    //
    //        // Insert screen shot as first step
    //        let previousStep = alignedSteps[0]
    //        alignedSteps.unshift(new Step(previousStep.deviceId, 0, [], previousStep.image, previousStep.deviceOptions, previousStep.isCheckPoint))
    //
    //        // Move screen shot to previous step
    //        for (let index = 1; index < alignedSteps.length; ++index) {
    //            var step = alignedSteps[index];
    //            if (previousStep.commands.length !== 1) {
    //                throw new Error('Invalid flow to fix command alignment. Each step must have exactly one command, i.e. not be compressed.');
    //            }
    //            previousStep.image = step.image
    //        }
    //
    //        // Remove image from last step
    //        alignedSteps[alignedSteps.length - 1].image = new Buffer([]);
    //        return alignedSteps;
    //    });
    //    // Concatenate compressed steps of all devices
    //    this.steps = alignedDeviceSteps.reduce((previous, current) => previous.concat(current), []);
    //    return this;
    //}
    //
    ///**
    // * Merge consecutive steps with the identical screen shots of the same device.
    // * @returns {Flow}
    // */
    //compressSteps() {
    //
    //    // Compress steps for each device
    //    let compressedDeviceSteps = this.devices().map(id => {
    //        let deviceSteps = this.deviceSteps(id)
    //        if (deviceSteps.length === 0) {
    //            return [];
    //        }
    //
    //        let lastStep = deviceSteps[0]
    //        let compressedSteps = [lastStep]
    //
    //        for (let index = 1; index < deviceSteps.length; ++index) {
    //            let step = deviceSteps[index];
    //            if (!lastStep.isCheckPoint && step.image instanceof Buffer && step.image.equals(lastStep.image)) {
    //                // Merge non-checkpoint steps with the same screen shot
    //                lastStep.commands = lastStep.commands.concat(step.commands);
    //            } else {
    //                lastStep = step;
    //                compressedSteps.push(lastStep);
    //            }
    //        }
    //        return compressedSteps;
    //    });
    //
    //    // Concatenate compressed steps of all devices
    //    this.steps = compressedDeviceSteps.reduce((previous, current) => previous.concat(current), []);
    //    return this;
    //}


    /**
     * @typedef {Object} FlowJSON
     * @property {Array.<DeviceJSON>} devices
     */

    /**
     * @returns {string}
     */
    toJSON() {
        return JSON.stringify({
            devices: this.devices
        })
    }

    /**
     * @param {FlowJSON|string} json
     * @returns {Flow}
     */
    static fromJSON(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        return (new Flow()).addDevices(json.devices.map(deviceJSON => Device.fromJSON(deviceJSON)))
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    store(file) {
        file = file || Flow.FILE;
        var json = this.toJSON()
        fs.writeFileSync(file, json, "utf8");

        // Debug
        console.log("Store flow steps to disk: " + json.length);

        return this;
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    static load(file) {
        file = file || Flow.FILE;
        return Flow.fromJSON(fs.readFileSync(file, "utf8"))
    }
}

Flow.FILE = "steps.json";

module.exports = Flow;
