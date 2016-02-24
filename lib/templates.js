"use strict"

/**
 * @name Device
 * @type {object}
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
 * Device CSS sizes from http://www.mydevice.io/devices/
 *
 */
var devices = {
    /** @returns {Device} */
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

    /** @returns {Device} */
    nexus4: function () {
        // Generate a new object
        return {
            name: 'Nexus 4',
            type: 'phone',
            size: 'small',
            width: 384,
            height: 640,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    /** @returns {Device} */
    nexus5: function () {
        return {
            name: 'Nexus 5',
            type: 'phone',
            size: 'small',
            width: 360,
            height: 640,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    nexus7: function () {
        return {
            name: 'Nexus 7 (2012)',
            type: 'tablet',
            size: 'small',
            width: 604,
            height: 966,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    nexus7_landscape: function () {
        return {
            name: 'Nexus 7 (2012) Landscape mode',
            type: 'tablet',
            size: 'medium',
            width: 966,
            height: 604,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

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
    randomPhone: function () {
        return randomFromList(devicesOfType.phone.map(phone => phone()))
    },

    randomTablet: function () {
        return randomFromList(devicesOfType.phone.map(phone => phone()))
    },

    randomDesktop: function () {
        return randomFromList(devicesOfType.phone.map(phone => phone()))
    },

    /**
     * Return a randomly chosen device from a randomly chosen device type.
     * @param {Array} types
     * @returns {Object}
     */
    randomOfTypes: function(types) {
        return randomFromList(types.map(type => randomFromList(devicesOfType[type])))
    },

    /**
     * Return a randomly chosen device from a randomly chosen device size.
     * @param {Array} sizes
     * @returns {Object}
     */
    randomOfSizes: function(sizes) {
        return randomFromList(sizes.map(size => randomFromList(devicesOfSize[size])))
    },

    randomOfDevices: function(devices) {
        if (!devices) {
            devices = Object.keys(devices);
        }
        return randomFromList(devices)
    }
}

/**
 * @type {{phone: Function[], tablet: Function[], desktop: Function[]}}
 */
var devicesOfType = {
    phone: Object.keys(devices).filter(name => devices[name]().type == 'phone'),
    tablet: Object.keys(devices).filter(name => devices[name]().type == 'tablet'),
    desktop: Object.keys(devices).filter(name => devices[name]().type == 'desktop')
}

/**
 * @type {{small: Function[], large: Function[]}}
 */
var devicesOfSize = {
    small: Object.keys(devices).filter(name => devices[name]().size == 'small'),
    large: Object.keys(devices).filter(name => devices[name]().size == 'large')
}

/**
 * @param {Object[]} list
 * @returns {Object}
 */
function randomFromList(list) {
    return list[Math.floor(Math.random() * list.length)]
}

var types = Object.keys(devicesOfType)
var sizes = Object.keys(devicesOfSize)

// Assemble exports
var exports = {
    devices: devices,
    phones: devicesOfType.phone,
    tablets: devicesOfType.tablet,
    desktops: devicesOfType.desktop,
    random: random,
    types: types,
    sizes: sizes
}

module.exports = exports
