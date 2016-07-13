"use strict";

var fs = require("fs");
var Step = require("./step");
var Device = require("./device");
var Checkpoint = require("./checkpoint");
var Grid = require("./grid");
var crypto = require('crypto');
var path = require("path");
var mkdirp = require("mkdirp");

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

        /**
         * @type {string|null}
         */
        this.name = null;
    }

    /**
     * @param {string} name
     * @returns {Flow}
     */
    setName(name) {
        if (!(typeof name === "string" || name === null)) {
            throw new TypeError('Name should be a string. Given: ' + typeof name)
        }
        this.name = name
        return this
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
        return objectOrThrowError(this.devices[deviceId], 'device')
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
    }

    /**
     * Return a grid of checkpoints. One row per checkpoint name, one column per device.
     * @returns {Array.<GridRow>}
     */
    grid() {
        return new Grid(this.deviceArray()).rows
    }

    /**
     * @typedef {Object} FlowJSON
     * @property {string} name
     * @property {Array.<DeviceJSON>} devices
     */

    /**
     * @returns {Object}
     */
    toJSON() {
        return {
            name: this.name,
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
        return new Flow().setName(json.name).addDevices(deviceJSONs.map(deviceJSON => Device.fromJSON(deviceJSON)))
    }

    /**
     * Return the SHA1 hash of the json representation
     * @returns {string}
     */
    sha() {
        return crypto.createHash('sha1').update(JSON.stringify(this)).digest("hex")
    }


    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    store(file) {
        file = file || this.filePath()
        let json = JSON.stringify(this.toJSON())

        // Create parent directories
        mkdirp.sync(path.dirname(file))

        // Write file
        fs.writeFileSync(file, json, "utf8")

        // Remember the last storage
        this.setLastStore(file)

        return this
    }

    /**
     * Set the last storage
     * @param {string} fileName
     * @return {Flow}
     */
    setLastStore(fileName) {
        this.lastStoredFileName = fileName
        this.lastStoreHash = this.sha()
        return this
    }

    /**
     * @param {string} [file]
     * @returns {Flow}
     */
    storeIfChanged(file) {
        file = file || this.filePath()
        let sha = this.sha()
        if (!(this.lastStoredFileName === file && this.lastStoreHash === sha)) {
            this.store(file)
        }
        return this
    }

    /**
     * @returns {string} Full file path
     */
    filePath() {
        // Remove any non-alphanumeric from the filename
        let fileName = this.name === null ? '' : ('_' + this.name.replace(/[^a-z0-9]/gi, '_').toLowerCase())
        return path.join(Flow.DIRECTORY, 'flow' + fileName + '.json')
    }

    /**
     * @param {string} file
     * @returns {Flow}
     */
    static load(file) {
        let json = fs.readFileSync(file, "utf8")
        return Flow.fromJSON(json)
    }
}

Flow.DIRECTORY = "flows"

module.exports = Flow
