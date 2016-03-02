"use strict";

var xdTesting = require('./index');
var WebdriverIOMultiBrowser = require('webdriverio/lib/multibrowser');
var q = require('q');

/**
 * @constructor
 * @extends {Multibrowser}
 */
function MultiDevice(options){
    WebdriverIOMultiBrowser.call(this);
    /**
     * @type {Object.<string, Device>}
     */
    this.options = options;
}

// Inherit from WebdriverIOMultiBrowser
MultiDevice.prototype = Object.create(WebdriverIOMultiBrowser.prototype);


/**
 * Modifier for multi instance.
 * @returns {Function} - Modify or add functionality for the given client
 * @override
 */
MultiDevice.prototype.getModifier = function() {

    var multiDevice = this;

    return function(client) {
        // Call parent method.
        var parentModifier = WebdriverIOMultiBrowser.prototype.getModifier.call(multiDevice);
        client = parentModifier.call(multiDevice, client);

        // Add additional functionality
        /**
         *
         * @param {string[]|string} ids - A single id or an array of ids
         */
        client.selectById = ids => {
            if (!ids instanceof Array) {
                ids = [ids]
            }

            // TODO Refactor this: Merge with multiremote() ?
            var newMultiDevice = new MultiDevice()
            ids.forEach(id => {
                newMultiDevice.addInstance(id, multiDevice.instances[id]);
            })
            newMultiDevice.options = multiDevice.options;
            return xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);
        };

        /**
         *
         * @param {string[]|string} size - A single size or an array of sizes
         */
        client.selectBySize = size => {
            if (!size instanceof Array) {
                size = [size]
            }

            var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => size.indexOf(multiDevice.options[id].size) >= 0);

            // TODO Refactor this: Merge with multiremote() ?
            var newMultiDevice = new MultiDevice()
            matchingInstanceIds.forEach(id => {
                newMultiDevice.addInstance(id, multiDevice.instances[id]);
            })
            newMultiDevice.options = multiDevice.options;
            return xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);
        };

        /**
         * @callback DeviceCallback
         * @param {WebdriverIO.Client} device
         * @param {number} index
         */

        /**
         * @param {DeviceCallback} callback
         */
        client.forEach = (callback) => {
            var results = [];
            var index = 0;
            Object.keys(multiDevice.instances).forEach(device => {
                results.push(callback(device, index++));
            });
            return client.call(function() {
                return q.all(results);
            });
        };

        return client;
    }
}

module.exports = MultiDevice