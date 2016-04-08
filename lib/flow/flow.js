"use strict";

var fs = require("fs");
var Step = require("./step");
var Device = require("./device");
var Checkpoint = require("./checkpoint");

/**
 * @template T
 * @param {T} obj
 * @param {string} type
 * @returns {T}
 */
function objectOrThrowError(obj, type) {
    if (!obj) {
        throw new Error(type + ' not found')
    }
    return obj
}

class Flow {

    constructor() {
        /**
         * @type {Object.<string, Device>}
         */
        this.devices = {};
    }

    /**
     * @param {Array.<Device>} devices
     * @returns {Flow}
     */
    addDevices(devices) {
        devices.forEach(device => this.devices[device.deviceId] = device)
        return this
    }

    /**
     * @param {string} deviceId
     * @returns {Device}
     */
    device(deviceId) {
        let device = this.devices[deviceId]
        //if (!device) throw new Error('device not found ' + deviceId)
        return device
    }

    /**
     * @returns {Array.<Checkpoint>}
     */
    checkpoints() {
        let devicesArray = Object.keys(this.devices).map(id => this.devices[id])
        return devicesArray.reduce((checkpoints, device) => checkpoints.concat(device.checkpoints), [])
    }

    /**
     * @returns {Array.<Step>}
     */
    steps() {
        return this.checkpoints().reduce((steps, checkpoint) => steps.concat(checkpoint.steps), [])
    }

    /**
     * @param {number} id
     * @returns {Checkpoint}
     */
    checkpoint(id) {
        return objectOrThrowError(this.checkpoints().find(checkpoint => checkpoint.id === id), 'checkpoint')
    }

    /**
     * @param {number} id
     * @returns {Step}
     */
    step(id) {
        return objectOrThrowError(this.steps().find(step => step.stepId === id), 'step')
    }

    /**
     * @returns {number}
     */
    generateStepId() {
        return this.steps.length
        //let max = this.steps().reduce((max, current) => {
        //    if (max === null) {
        //        return current
        //    }
        //    return current.stepId > max.stepId ? current : max
        //}, null)
        //return max !== null ? max + 1 : 0
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
        return (new Flow()).addDevices(Object.keys(json.devices).map(deviceJSON => Device.fromJSON(deviceJSON)))
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
        console.log("Store flow to disk: " + json.length + " bytes");

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
