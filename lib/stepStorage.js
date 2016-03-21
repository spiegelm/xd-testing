"use strict";

var fs = require("fs");
var Step = require("./step");

/**
 * @constructor
 */
function StepStorage() {
    /**
     * @type {Step[]}
     */
    this.steps = [];
}

StepStorage.FILE = "steps.json";

/**
 * @param {Step} step
 * @returns {StepStorage}
 */
StepStorage.prototype.addStep = function (step) {
    if (!(step instanceof Step)) {
        throw new Error('Argument must be instance of Step.');
    }
    this.steps.push(step);
    return this;
}

/**
 * @returns {StepStorage}
 */
StepStorage.prototype.store = function () {
    var json = this.steps.map(step => step.toJson());
    fs.writeFileSync(StepStorage.FILE, JSON.stringify(json), "utf8");

    return this;
}

/**
 * @returns {StepStorage}
 */
StepStorage.prototype.load = function () {
    var data = fs.readFileSync(StepStorage.FILE, "utf8");
    var steps = JSON.parse(data);

    steps.forEach(step => {
        this.addStep(Step.parse(step));
    })
    return this;
}

module.exports = StepStorage;
