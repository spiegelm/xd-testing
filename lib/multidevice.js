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

        // TODO add custom `select` return xdTesting.remote()

        /**
         *
         * @param {string[]|string} ids - A single id or an array of ids
         */
        client.selectById = ids => {
            if (!ids instanceof Array) {
                ids = [ids]
            }

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
         * @param {DeviceCallback?} callback
        */
        client.selectBySize = function selectBySize(sizes, callback) {
            sizes = Array.isArray(sizes) ? sizes : [sizes];
            callback = callback || function(device) { return device };

            var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => sizes.indexOf(multiDevice.options[id].size) >= 0);

            // TODO Refactor this: Merge with multiremote() ?

            // TODO use only corresponding option items
            var newOptions = multiDevice.options;
            var newMultiDevice = new MultiDevice(newOptions);

            matchingInstanceIds.forEach(id => {
                newMultiDevice.addInstance(id, multiDevice.instances[id]);
            })
            var newRemote = xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);

            return {selectedDevices: newRemote};
            //return client.then(callback(newRemote));


            //var dummy = () => {
            //    var remote = xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);
            //    remote.selectBySize(['small'], phones => phones
            //        .click()
            //        .getUrl(url => console.log(url))
            //    );
            //}

            //var defer = q.defer();
            //defer.resolve(newRemote);
            //return defer.promise;

            //var then = function(callback) {
            //    return callback(newRemote);
            //}
            //return {then: then};

            //// We cannot return the remote object directly, because it's a promise.
            //// WebdriverIO overrides the client.then() function to resolve promises and does not respect their return value.
            //return {selectedDevices: remote};
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
            var results = [];
            var index = 0;
            Object.keys(multiDevice.instances).forEach(device => {
                results.push(callback(multiDevice.instances[device], index++));
            });
            return client.call(function() {
                return q.all(results);
            });
        };

        return client;
    }
}

module.exports = MultiDevice