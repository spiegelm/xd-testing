"use strict"


/**
 * Sizes categories from http://v4-alpha.getbootstrap.com/layout/grid/#grid-options
 * Device CSS sizes from http://www.mydevice.io/devices/
 */
var templates = {
    chrome: function () {
        // Generate a new object
        return {
            name: 'Chrome',
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

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
            size: 'large',
            width: 966,
            height: 604,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    nexus10: function () {
        return {
            name: 'Nexus 10',
            type: 'tablet',
            size: 'x-large',
            width: 1280,
            height: 800,
            desiredCapabilities: {browserName: 'chrome'}
        }
    },

    randomPhone: function () {
        return templates.phones[Math.floor(Math.random() * phones.length)]
    },

    randomTablet: function () {
        return templates.tablets[Math.floor(Math.random() * tablets.length)]
    },

    randomDesktop: function () {
        return templates.chrome()
    },

    types: ['phone', 'table', 'desktop'],
    sizes: ['small', 'x-large'],

    phones: function() {
        return [templates.nexus4(), templates.nexus5()]
    },

    tablets: function() {
        return [templates.nexus7(), templates.nexus7_landscape(), templates.nexus10()]
    }
};

module.exports = templates;
