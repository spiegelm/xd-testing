"use strict";

var xdTesting = require('./index');
var WebdriverIOMultiBrowser = require('webdriverio/lib/multibrowser');

/**
 * @constructor
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

            var newMultiDevice = new MultiDevice()
            ids.forEach(id => {
                newMultiDevice.addInstance(id, multiDevice.instances[id]);
            })
            return xdTesting.remote(multiDevice.options, newMultiDevice.getModifier());
        };

        //client.addCommand = () => {
        //    console.log('addCommand is not supported. Ignored.');
        //};

        /**
         * @param {Function} callback
         */
        client.forEach = (callback) => {
            multiDevice.instances.forEach(callback);
        };

        return client;
    }
}

module.exports = MultiDevice