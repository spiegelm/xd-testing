"use strict"

var xdTesting = require('../lib/index');
var q = require('q');

var utility = {

    waitforTimeout: 30 * 1000,

    /**
     * @param options
     * @returns {WebdriverIO.Client}
     */
    initWithDevices: function (options) {

        var self = this;

        // Store id into device
        Object.keys(options).forEach(function (id) {
            var device = options[id];
            device['id'] = id;
            device['waitforTimeout'] = utility.waitforTimeout;
        });

        self.deviceOptions = options;

        // New browser instances with WebdriverIO
        let devices
        return devices = xdTesting.multiremote(options).init()
            .timeoutsAsyncScript(15 * 1000)
            .getCount().then(count => {
                // Align windows on screen
                let tileWidth = Math.floor(1600 / count);
                let x = 0;
                Object.keys(options).forEach(deviceName => {
                    var device = devices.select(deviceName)
                    var width = options[deviceName].width || tileWidth
                    var height = options[deviceName].height || 600

                    // Set window sizes
                    device.windowHandleSize({width: width, height: height})

                    // Align window on screen
                    device.windowHandlePosition({x: x, y: 0})
                    x += tileWidth
                });
            });
    },

    /**
     * @callback multiActionCallback
     * @param {WebdriverIO.Client} device
     */

    /**
     * Executes callback on devices matching deviceNames.
     * Returns a promise.
     * @param devices
     * @param deviceIds
     * @param {multiActionCallback} callback
     * @returns Q.Promise<T[]>
     */
    multiAction: function multiAction(devices, deviceIds, callback) {
        var promises = [];
        deviceIds.forEach(function (id) {
            var device = devices.select(id);
            promises.push(callback(device));
        });
        return q.all(promises);
    }

};

module.exports = utility;
