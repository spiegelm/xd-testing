"use strict"

/**
 * @typedef {Object} TemplateDevice
 * @property {string} name
 * @property {string} type
 * @property {string} size
 * @property {number} width
 * @property {number} height
 * @property {Object} desiredCapabilities
 */


/**
 * Sizes categories from http://getbootstrap.com/css/#grid-options
 *
 * Device CSS sizes from https://design.google.com/devices/
 *
 */
var devices = {
    /**
     * @returns {TemplateDevice}
     */
    chrome: function () {
        // Generate a new object
        return {
            name: 'Chrome',
            type: 'desktop',
            size: 'large',
            width: 1280,
            height: 720,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    /**
     * @returns {TemplateDevice}
     */
    moto360: function() {
        return {
            name: 'Moto 360',
            type: 'watch',
            size: 'xsmall',
            width: 241,
            height: 248,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    /**
     * @returns {TemplateDevice}
     */
    nexus4: function () {
        return {
            name: 'Nexus 4',
            type: 'phone',
            size: 'xsmall',
            width: 384,
            height: 640,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    /**
     * @returns {TemplateDevice}
     */
    nexus5: function () {
        return {
            name: 'Nexus 5',
            type: 'phone',
            size: 'xsmall',
            width: 360,
            height: 640,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    /**
     * @returns {TemplateDevice}
     */
    nexus7: function () {
        return {
            name: 'Nexus 7 (2012)',
            type: 'tablet',
            size: 'xsmall',
            width: 600,
            height: 960,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    /**
     * @returns {TemplateDevice}
     */
    nexus7_landscape: function () {
        return {
            name: 'Nexus 7 (2012) Landscape mode',
            type: 'tablet',
            size: 'medium',
            width: 960,
            height: 600,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    /**
     * @returns {TemplateDevice}
     */
    ipad_mini: function() {
        return {
            name: 'Apple iPad mini',
            type: 'tablet',
            size: 'small',
            width: 768,
            height: 1024,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    /**
     * @returns {TemplateDevice}
     */
    nexus10: function () {
        return {
            name: 'Nexus 10',
            type: 'tablet',
            size: 'large',
            width: 1280,
            height: 800,
            desiredCapabilities: {browserName: 'chrome'}
        }
    }
}

var random = {
    /**
     * @returns {TemplateDevice}
     */
    randomPhone: function () {
        return randomFromList(devicesOfType.phone.map(phone => phone()))
    },

    /**
     * @returns {TemplateDevice}
     */
    randomTablet: function () {
        return randomFromList(devicesOfType.phone.map(phone => phone()))
    },

    /**
     * @returns {TemplateDevice}
     */
    randomDesktop: function () {
        return randomFromList(devicesOfType.phone.map(phone => phone()))
    },

    /**
     * Return a randomly chosen device name from a randomly chosen device type.
     * @param {string[]} types - List of types
     * @returns {string}
     */
    randomOfTypes: function(types) {
        return randomFromList(types.map(type => randomFromList(devicesOfType[type])))
    },

    /**
     * Return a randomly chosen device name from a randomly chosen device size.
     * @param {string[]} sizes - List of sizes
     * @returns {string}
     */
    randomOfSizes: function(sizes) {
        return randomFromList(sizes.map(size => randomFromList(devicesOfSize[size])))
    },

    /**
     * Return a randomly chosen device name
     * @param {string[]} [deviceNames] - List of device names
     * @returns {string}
     */
    randomOfDevices: function(deviceNames) {
        if (!deviceNames) {
            deviceNames = Object.keys(deviceNames);
        }
        return randomFromList(deviceNames)
    }
}

/**
 * @type {{phone: Function[], tablet: Function[], desktop: Function[]}}
 */
var devicesOfType = {
    watch: Object.keys(devices).filter(name => devices[name]().type == 'watch'),
    phone: Object.keys(devices).filter(name => devices[name]().type == 'phone'),
    tablet: Object.keys(devices).filter(name => devices[name]().type == 'tablet'),
    desktop: Object.keys(devices).filter(name => devices[name]().type == 'desktop')
}

/**
 * @type {{small: Function[], medium: Function[], large: Function[]}}
 */
var devicesOfSize = {
    xsmall: Object.keys(devices).filter(name => devices[name]().size == 'xsmall'),
    small: Object.keys(devices).filter(name => devices[name]().size == 'small'),
    medium: Object.keys(devices).filter(name => devices[name]().size == 'medium'),
    large: Object.keys(devices).filter(name => devices[name]().size == 'large')
}

/**
 * @param {Array<T>} list
 * @returns {T}
 * @template T
 */
function randomFromList(list) {
    return list[Math.floor(Math.random() * list.length)]
}

var types = Object.keys(devicesOfType)
var sizes = Object.keys(devicesOfSize)

// Assemble exports
var exports = {
    devices: devices,
    watch: devicesOfType.watch,
    phones: devicesOfType.phone,
    tablets: devicesOfType.tablet,
    desktops: devicesOfType.desktop,
    xsmall: devicesOfSize.xsmall,
    small: devicesOfSize.small,
    medium: devicesOfSize.medium,
    large: devicesOfSize.large,
    random: random,
    types: types,
    sizes: sizes
}

module.exports = exports
