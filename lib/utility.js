"use strict"

var xdTesting = require('../lib/index');
var q = require('q');

var utility = {

    waitforTimeout: 30 * 1000,

    initWithDevices: function (devices) {

        var self = this;

        // Store id into device
        Object.keys(devices).forEach(function (id) {
            var device = devices[id];
            device['id'] = id;
            device['waitforTimeout'] = utility.waitforTimeout;
        });

        self.deviceOptions = devices;

        // New browser instance with WebdriverIO
        self.devices = xdTesting.multiremote(self.deviceOptions);

        var tileWidth = Math.floor(1600 / self.devicesCount());

        return self.devices.init()
            .timeoutsAsyncScript(15 * 1000)
            .then(function () {
                // Align windows on screen
                var x = 0;
                Object.keys(self.deviceOptions).forEach(deviceName => {
                    var device = self.devices.select(deviceName);
                    var width = self.deviceOptions[deviceName].width || tileWidth;
                    var height = self.deviceOptions[deviceName].height || 600;

                    // Set window sizes
                    device.windowHandleSize({width: width, height: height})

                    // Align window on screen
                    device.windowHandlePosition({x: x, y: 0});
                    x += tileWidth;
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
