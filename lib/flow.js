"use strict";

var fs = require("fs");
var Step = require("./step");

/**
 * @constructor
 */
function Flow() {
    /**
     * @type {Step[]}
     */
    this.steps = [];
}

Flow.FILE = "steps.json";

/**
 * @param {Step} step
 * @returns {Flow}
 */
Flow.prototype.addStep = function (step) {
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
Flow.prototype.deviceSteps = function(deviceId) {
    return this.steps.filter(step => step.deviceId === deviceId);
}

/**
 * @returns {Array.<str>}
 */
Flow.prototype.devices = function() {
    return Object.keys(this.steps.reduce(function(previous, current) {
        previous[current.deviceId] = '';
        return previous;
    }, {})).sort();
}

/**
 * Merge consecutive steps with the identical screen shots of the same device.
 * @returns {Flow}
 */
Flow.prototype.compressSteps = function() {
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
 * @returns {Flow}
 */
Flow.prototype.store = function () {
    var json = this.steps;
    fs.writeFileSync(Flow.FILE, JSON.stringify(json), "utf8");

    return this;
}

/**
 * @returns {Flow}
 */
Flow.prototype.load = function () {
    var data = fs.readFileSync(Flow.FILE, "utf8");
    var rawSteps = JSON.parse(data);

    rawSteps.forEach(rawStep => {
        this.addStep(Step.fromJson(rawStep));
    })
    return this;
}

module.exports = Flow;
