"use strict";

var fs = require("fs");
var Step = require("./step");

class Flow {

    constructor() {
        /**
         * @type {Step[]}
         */
        this.steps = []
        this.FILE = "steps.json";
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
     * @param {str} deviceId
     * @returns {Array.<Step>}
     */
    deviceSteps(deviceId) {
        return this.steps.filter(step => step.deviceId === deviceId);
    }

    /**
     * @returns {Array.<str>}
     */
    devices() {
        return Object.keys(this.steps.reduce(function (previous, current) {
            previous[current.deviceId] = '';
            return previous;
        }, {})).sort();
    }


    /**
     * Merge consecutive steps with the identical screen shots of the same device.
     * @returns {Flow}
     */
    compressSteps() {
        let compressedDeviceSteps = this.devices().map(id => {
            let deviceSteps = this.deviceSteps(id)
            if (deviceSteps.length == 0) {
                return [];
            }

            let lastStep = deviceSteps[0]
            let compressedSteps = [lastStep]

            for (let index = 1; index < deviceSteps.length; ++index) {
                let step = deviceSteps[index];
                if (step.image instanceof Buffer && step.image.equals(lastStep.image)) {
                    // Merge steps with the same screen shot
                    lastStep.commands = lastStep.commands.concat(step.commands);
                } else {
                    lastStep = step;
                    compressedSteps.push(lastStep);
                }
            }
            return compressedSteps;
        });
        this.steps = compressedDeviceSteps.reduce((previous, current) => previous.concat(current), []);
        return this;
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    store(file) {
        file = file || this.FILE;
        var json = this.steps;
        fs.writeFileSync(file, JSON.stringify(json), "utf8");

        return this;
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    load(file) {
        file = file || this.FILE;
        var data = fs.readFileSync(file, "utf8");
        var rawSteps = JSON.parse(data);

        rawSteps.forEach(rawStep => {
            this.addStep(Step.fromJson(rawStep));
        })
        return this;
    }

}

module.exports = Flow;
