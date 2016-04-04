"use strict";

var fs = require("fs");
var Step = require("./step");

class Flow {

    constructor() {
        /**
         * @type {Step[]}
         */
        this.steps = []
    }

    /**
     * @param {Step} step
     * @returns {Flow}
     */
    addStep(step) {
        if (!(step instanceof Step)) {
            throw new Error('Argument must be instance of Step.');
        }
        this.steps.push(step);
        return this;
    }

    /**
     * @param {string} deviceId
     * @returns {Array.<Step>}
     */
    deviceSteps(deviceId) {
        return this.steps.filter(step => step.deviceId === deviceId);
    }

    /**
     * @returns {Array.<string>}
     */
    devices() {
        return Object.keys(this.steps.reduce(function (previous, current) {
            previous[current.deviceId] = '';
            return previous;
        }, {})).sort();
    }

    /**
     *
     * @returns {Flow}
     */
    fixCommandAlignment() {
        // align steps for each device
        let alignedDeviceSteps = this.devices().map(id => {
            let alignedSteps = this.deviceSteps(id)
            if (alignedSteps.length === 0) {
                return [];
            }

            // Insert screen shot as first step
            let previousStep = alignedSteps[0]
            alignedSteps.unshift(new Step(previousStep.deviceId, 0, [], previousStep.image, previousStep.deviceOptions, previousStep.isCheckPoint))

            // Move screen shot to previous step
            for (let index = 1; index < alignedSteps.length; ++index) {
                var step = alignedSteps[index];
                if (previousStep.commands.length !== 1) {
                    throw new Error('Invalid flow to fix command alignment. Each step must have exactly one command, i.e. not be compressed.');
                }
                previousStep.image = step.image
            }

            // Remove image from last step
            alignedSteps[alignedSteps.length - 1].image = new Buffer([]);
            return alignedSteps;
        });
        // Concatenate compressed steps of all devices
        this.steps = alignedDeviceSteps.reduce((previous, current) => previous.concat(current), []);
        return this;
    }

    /**
     * Merge consecutive steps with the identical screen shots of the same device.
     * @returns {Flow}
     */
    compressSteps() {
        // Compress steps for each device
        let compressedDeviceSteps = this.devices().map(id => {
            let deviceSteps = this.deviceSteps(id)
            if (deviceSteps.length === 0) {
                return [];
            }

            let lastStep = deviceSteps[0]
            let compressedSteps = [lastStep]

            for (let index = 1; index < deviceSteps.length; ++index) {
                let step = deviceSteps[index];
                if (!lastStep.isCheckPoint && step.image instanceof Buffer && step.image.equals(lastStep.image)) {
                    // Merge non-checkpoint steps with the same screen shot
                    lastStep.commands = lastStep.commands.concat(step.commands);
                } else {
                    lastStep = step;
                    compressedSteps.push(lastStep);
                }
            }
            return compressedSteps;
        });
        // Concatenate compressed steps of all devices
        this.steps = compressedDeviceSteps.reduce((previous, current) => previous.concat(current), []);
        return this;
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    store(file) {
        file = file || Flow.FILE;
        var json = this.steps;
        fs.writeFileSync(file, JSON.stringify(json, 2), "utf8");

        // Debug
        console.log("Store flow with " + this.steps.length + " steps to disk");

        return this;
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    load(file) {
        file = file || Flow.FILE;
        var data = fs.readFileSync(file, "utf8");
        var rawSteps = JSON.parse(data);

        rawSteps.forEach(rawStep => {
            this.addStep(Step.fromJson(rawStep));
        })
        return this;
    }

}

Flow.FILE = "steps.json";

module.exports = Flow;
