"use strict";

var xdTesting = require('../index');
var MultiDevice = require('../multidevice');


/**
 *
 * @param {MultiDevice} multiDevice
 * @returns {getCount}
 */
module.exports = (multiDevice) => {

    /**
     *
     * @param {string[]|string} sizes - A single size or an array of sizes
     * @param {DeviceCallback?} callback
     */
    return function selectBySizeCommand(sizes, callback) {
        sizes = Array.isArray(sizes) ? sizes : [sizes];
        if (!callback) {
            throw new Error("Callback missing: " + callback);
        } else if (typeof callback != 'function') {
            throw new Error("Invalid callback type: " + typeof callback);
        }

        var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => sizes.indexOf(multiDevice.options[id].size) >= 0);

        // TODO Refactor this: Merge with multiremote() ?

        // TODO use only corresponding option items
        var newOptions = multiDevice.options;
        var newMultiDevice = new MultiDevice(newOptions);

        matchingInstanceIds.forEach(id => {
            newMultiDevice.addInstance(id, multiDevice.instances[id]);
        })
        var newRemote = xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);

        return callback(newRemote);

        //return {selectedDevices: newRemote};
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
};
