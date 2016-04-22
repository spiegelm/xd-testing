"use strict";

var fs = require("fs");
var Step = require("./step");
var Device = require("./device");
var Checkpoint = require("./checkpoint");
var Grid = require("./grid");
var crypto = require('crypto');

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
     * @returns {Array.<Device>}
     */
    deviceArray() {
        return Object.keys(this.devices).map(id => this.devices[id])
    }

    /**
     * @returns {Array.<Checkpoint>}
     */
    checkpoints() {
        return this.deviceArray().reduce((checkpoints, device) => checkpoints.concat(device.checkpoints), [])
    }

    /**
     * @returns {Array.<Step>}
     */
    steps() {
        return this.checkpoints().reduce((steps, checkpoint) => steps.concat(checkpoint.steps), [])
    }

    /**
     * @param {string} id
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
     * @returns {Number}
     */
    generateCheckpointId() {
        return this.checkpoints().length
    }

    /**
     * @returns {Number}
     */
    generateStepId() {
        return this.steps().length
        //let max = this.steps().reduce((max, current) => {
        //    if (max === null) {
        //        return current
        //    }
        //    return current.stepId > max.stepId ? current : max
        //}, null)
        //return max !== null ? max + 1 : 0
    }

    gridTopologicalSort() {
        ///**
        // * @type {Object.<string, Checkpoint>}
        // */
        //let representative = {}
        //
        ///**
        // * @type {Object.<string, Array.<Checkpoint>>}
        // */
        //let checkpointsWithName = {}
        //
        ///**
        // * @type {Array.<Checkpoint>}
        // */
        //let checkpoints = []
        //
        ///**
        // * @type {Array.<Array.<Checkpoint>>}
        // */
        //let reprGraph = []
        //let successors = []
        //let predecessors = []
        //
        //this.deviceArray().forEach(device => device.checkpoints.forEach(checkpoint => {
        //    checkpoint.deviceId = device.deviceId
        //    checkpoints.push(checkpoint)
        //}))
        //
        //// Choose a representative checkpoint for each name to merge checkpoints with the same name
        //// Do some initialization
        //checkpoints.forEach((checkpoint) => {
        //    if (!representative[checkpoint.name]) {
        //        representative[checkpoint.name] = checkpoint
        //        checkpointsWithName[checkpoint.name] = []
        //    }
        //    checkpointsWithName[checkpoint.name].push(checkpoint)
        //    reprGraph[checkpoint.id] = []
        //    successors[checkpoint.id] = 0
        //    predecessors[checkpoint.id] = 0
        //})
        //
        ///**
        // * @param deviceId
        // * @param checkpoint
        // * @returns {Checkpoint|null}
        // */
        //let successor = (deviceId, checkpoint) => {
        //    let successor = null
        //    let checkpoints = this.device(deviceId).checkpoints
        //    checkpoints.forEach((iter, i, checkpoints) => {
        //        if (iter.name == checkpoint.name) {
        //            if (i + 1 < checkpoints.length) {
        //                successor = checkpoints[i+1]
        //            }
        //        }
        //    })
        //    return successor
        //}
        //
        //// Build graph
        //checkpoints.forEach((checkpoint) => {
        //    let repr = representative[checkpoint.name]
        //    let succ = successor(checkpoint.deviceId, checkpoint)
        //
        //    if (succ !== null) {
        //        if (reprGraph[repr.id].indexOf(representative[succ.name]) === -1) {
        //            reprGraph[repr.id].push(representative[succ.name])
        //            successors[repr.id]++
        //            predecessors[representative[succ.name].id]++
        //        }
        //    }
        //})
        //
        //console.log(reprGraph)
        //console.log(successors)
        //console.log(predecessors)
        //
        //// Topological sort
        ///**
        // * @type {Array.<Checkpoint>}
        // */
        //let currentSet = this.deviceArray().map(device => device.checkpoints[0])
        //let order = 0
        //currentSet.forEach(checkpoint => {
        //    reprGraph[checkpoint]
        //})
    }

    /**
     * Return a grid of checkpoints. One row per checkpoint name, one column per device.
     * @returns {Array.<GridRow>}
     */
    grid() {
        return new Grid(this.deviceArray()).rows
    }

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
        return {
            devices: this.devices
        }
    }

    /**
     * @param {FlowJSON|string} json
     * @returns {Flow}
     */
    static fromJSON(json) {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        let deviceJSONs = Object.keys(json.devices).map(key => json.devices[key])
        return new Flow().addDevices(deviceJSONs.map(deviceJSON => Device.fromJSON(deviceJSON)))
    }

    /**
     * Return the SHA1 hash of the json representation
     * @returns {string}
     */
    sha() {
        return crypto.createHash('sha1').update(JSON.stringify(this.toJSON())).digest("hex")
    }


    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    store(file) {
        file = file || Flow.FILE
        var json = JSON.stringify(this.toJSON())
        fs.writeFileSync(file, json, "utf8")

        // Debug
        console.log("Store flow to disk: " + file + ", " + json.length + " bytes")

        return this
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    storeIfChanged(file) {
        file = file || Flow.FILE
        let sha = this.sha()
        if (this.lastStoredFileName === file && this.lastStoreHash === sha) {
            console.log("Skip storing flow storage: no changes. " + sha)
        } else {
            this.lastStoredFileName = file
            this.lastStoreHash = sha
            console.log(this.lastStoredFileName, this.lastStoreHash, file, sha)
            this.store(file)
        }
        return this
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    static load(file) {
        file = file || Flow.FILE;
        let json = fs.readFileSync(file, "utf8")
        //console.log(json)
        return Flow.fromJSON(json)
    }
}

Flow.FILE = "steps.json";

module.exports = Flow;
