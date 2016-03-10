"use strict";

var xdTesting = require('./index');
var WebdriverIOMultiBrowser = require('webdriverio/lib/multibrowser');
var q = require('q');

/**
 * @constructor
 * @extends {Multibrowser}
 */
function MultiDevice(options) {
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
MultiDevice.prototype.getModifier = function () {

    var multiDevice = this;

    return function (client) {
        // Call parent method.
        var parentModifier = WebdriverIOMultiBrowser.prototype.getModifier.call(multiDevice);
        client = parentModifier.call(multiDevice, client);

        // Add additional functionality

        // TODO add custom `select` return xdTesting.remote()

        /**
         *
         * @param {string[]|string} ids - A single id or an array of ids
         * @param {DeviceCallback} callback
         */
        client.selectById = function selectById(ids, callback) {
            if (!ids instanceof Array) {
                ids = [ids]
            }
            //if (typeof callback !== 'function') {
            //    throw new Error("Invalid callback");
            //}

            // TODO Refactor this: Merge with multiremote() ?

            // TODO fix newOptions
            var newOptions = multiDevice.options;
            var newMultiDevice = new MultiDevice(newOptions);
            ids.forEach(id => {
                newMultiDevice.addInstance(id, multiDevice.instances[id]);
            })
            return xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);
        };

        /**
         *
         * @param {string[]|string} sizes - A single size or an array of sizes
         * @param {DeviceCallback} callback
         */
        client.selectBySize = function selectBySize(sizes, callback) {
            sizes = Array.isArray(sizes) ? sizes : [sizes];
            callback = callback || function (device) {
                    return device
                };

            var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => sizes.indexOf(multiDevice.options[id].size) >= 0);

            // TODO Refactor this: Merge with multiremote() ?

            // TODO use only corresponding option items
            var newOptions = multiDevice.options;
            var newMultiDevice = new MultiDevice(newOptions);

            matchingInstanceIds.forEach(id => {
                newMultiDevice.addInstance(id, multiDevice.instances[id]);
            })
            var newRemote = xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);

            return client.call(function () {
                return callback(newRemote);
            })
        }

        /**
         * @callback DeviceCallback
         * @param {WebdriverIO.Client} device
         */

        /**
         * @callback SingleDeviceCallback
         * @param {WebdriverIO.Client} device
         * @param {number} index
         */

        /**
         * @param {SingleDeviceCallback} callback
         */
        client.forEach = (callback) => {
            return client.call(function () {
                return q.all(Object.keys(multiDevice.instances).map(
                    (key, index) => callback(multiDevice.instances[key], index))
                );
            });
        };

        return client;
    }
}

module.exports = MultiDevice