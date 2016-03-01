"use strict";

var xdTesting = require('./index');
var WebdriverIOMultiBrowser = require('webdriverio/lib/multibrowser');
var q = require('q');

/**
 * @constructor
 * @extends {Multibrowser}
 */
function MultiDevice(){
    WebdriverIOMultiBrowser.call(this);
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
         * @callback DeviceCallback
         * @param {WebdriverIO.Client} device
         */

        /**
         * @param {DeviceCallback} callback
         */
        client.forEach = (callback) => {
            var results = [];
            Object.keys(multiDevice.instances).forEach(device => {
                results.push(callback(device));
            });
            return client.call(function() {
                return q.all(results);
            });
        };

        return client;
    }
}

module.exports = MultiDevice