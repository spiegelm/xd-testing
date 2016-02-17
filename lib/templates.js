"use strict"

var templates = {
    chrome: function () {
        // Generate a new object
        return {
            name: 'Chrome',
            desiredCapabilities: {browserName: 'chrome'}
        };
    },
    nexus4: function () {
        // Generate a new object
        return {
            name: 'Nexus 4',
            width: 768,
            height: 1280,
            desiredCapabilities: {browserName: 'chrome'}
        }
    }
};

module.exports = templates;
