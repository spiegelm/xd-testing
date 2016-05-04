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

    var stepIndex = 0;

    return function (client) {
        // Call parent method.
        let parentModifier = WebdriverIOMultiBrowser.prototype.getModifier.call(multiDevice);
        client = parentModifier.call(multiDevice, client);

        // Add additional functionality

        var _next = client.next;
        client.next = _next;

        //function next() {
        //    console.log('multidevice', arguments);
        //
        //    var self = this,
        //        promises = [],
        //        args = Array.prototype.slice.apply(arguments), // copy array
        //        stack = args.pop(),
        //        fnName = args.pop();
        //
        //    console.log(stepIndex, fnName);
        //
        //    stepIndex += 1;
        //
        //    return _next.apply(this, arguments)
        //        .then(() => {
        //            return client.forEach(device => {
        //                let screenShotName = './screenshots/step' + stepIndex + '_'
        //                    + device.options.id + '_' + fnName + '.png';
        //                console.log(screenShotName);
        //
        //                return device.saveScreenshot(screenShotName);
        //            });
        //        });
        //    //return client.lastPromise.done(function() {
        //    //    return client.forEach(device => saveScreenshot('./screenshots/step' + stepIndex + '_' + device.options.id + '_' + fnName + '.png'));
        //    //})
        //}

        // TODO add custom `select` return xdTesting.remote()

        /**
         * @param {string[]|string|DeviceIdsCallback} ids - A single id or an array of ids; can also be a promise
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.selectById = function selectById(ids, callback) {
            return client.call(function () {
                // Resolve ids callback
                if (ids instanceof Function) {
                    ids = ids()
                }
                // Normalize ids to array
                if (!Array.isArray(ids)) {
                    ids = [ids]
                }
                // TODO throw TypeError on invalid parameter types
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
         *
         * @param {string} selector - A css selector as used in WebdriverIO
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.selectByElement = function selectByElement(selector, callback) {
            selector = selector || null

            let matchingInstanceIds = []

            return client
                .forEach(device => device
                    .elements(selector)
                    .then(response => {
                        if (response.value.length) {
                            matchingInstanceIds.push(device.options.id)
                        }
                    })
                )
                // Provide ids per callback, otherwise the array is read before it is filled
                .selectById(() => matchingInstanceIds, callback)
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
         * @callback DeviceIdsCallback
         * @return {number|number[]}
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

        /**
         * @returns {number}
         */
        client.getCount = () => {
            let count = 0

            return client.forEach(device => {
                count++
            }).then(() => {
                return count
            })
        }

        return client;
    }
}

module.exports = MultiDevice
