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
        let parentModifier = WebdriverIOMultiBrowser.prototype.getModifier.call(multiDevice);
        client = parentModifier.call(multiDevice, client);

        // Add additional functionality

        // TODO add custom `select` return xdTesting.remote()

        /**
         * @param {string[]|string} ids - A single id or an array of ids
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.selectById = function selectById(ids, callback) {
            if (!Array.isArray(ids)) {
                ids = [ids]
            }
            //if (typeof callback !== 'function') {
            //    throw new Error("Invalid callback");
            //}

            // TODO Refactor this: Merge with multiremote() ?

            let newOptions = {};
            let newMultiDevice = new MultiDevice(newOptions);
            ids.forEach(id => {
                let instance = multiDevice.instances[id];

                if(!instance) {
                    throw new Error('browser "' + id + '" is not defined');
                }

                newMultiDevice.addInstance(id, instance);
                newOptions[id] = multiDevice.options[id];
            });
            var newRemote = xdTesting.remote(newOptions, newMultiDevice.getModifier(), newMultiDevice);

            return client.call(function () {
                return callback(newRemote);
            })
        };

        /**
         * @param {string[]|string} sizes - A single size or an array of sizes
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.selectBySize = function selectBySize(sizes, callback) {
            sizes = Array.isArray(sizes) ? sizes : [sizes];

            var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => sizes.indexOf(multiDevice.options[id].size) >= 0);

            return client.selectById(matchingInstanceIds, callback);
        }

        /**
         * @param {string[]|string} types - A single type or an array of types
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.selectByType = function selectByType(types, callback) {
            types = Array.isArray(types) ? types : [types];

            var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => types.indexOf(multiDevice.options[id].type) >= 0);

            return client.selectById(matchingInstanceIds, callback);
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