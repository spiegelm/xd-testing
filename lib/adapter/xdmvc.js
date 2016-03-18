"use strict"

var assert = require('chai').assert;
var utility = require('../utility')
var q = require('q');


var xdmvc = {

    injectEventLogger: function() {

        function EventLogger() {
            this.eventNames = ["XDdisconnection", "XDconnection", "XDdevice", "XDroles", "XDsync", "XDserverReady", "XDothersRolesChanged"];
            this.eventCounter = {};

            this.eventNames.forEach((function (event) {
                this.eventCounter[event] = 0;
                XDmvc.on(event, (function (sender) {
                    this.eventCounter[event]++;
                }).bind(this))
            }).bind(this));
        }

        window.eventLogger = new EventLogger();
        return 0;
    },

    getEventCounter: function() {
        return window.eventLogger.eventCounter;
    },

    pairDevicesViaURL: function() {
        var self = this;

        var deviceA = self.devices.select('A');

        return deviceA.url(self.baseUrl)
            .execute(function () {
                return 1 + 2;
            }).then(function (ret) {
                assert.equal(ret.value, 3);
            }).execute(xdmvc.injectEventLogger).then(function () {
            }).getUrl().then(function (url) {

                var allButA = Object.keys(self.deviceOptions).filter(function (deviceName) {
                    return deviceName != 'A';
                });
                return utility.multiAction(self.devices, allButA, function (device) {
                    return device.url(url);
                }).then(function () {
                    return deviceA.waitUntil(function () {
                        return deviceA.execute(xdmvc.getEventCounter).then(function (ret) {
                            return ret.value.XDconnection == self.devicesCount() - 1;
                        });
                    });
                });
            });
    },

    pairDevicesViaXDMVC: function() {
        var self = this;

        var deviceA = self.devices.select('A');

        // TODO wait for XD "initialized" event?

        var allDevices = Object.keys(self.deviceOptions);

        return utility.multiAction(self.devices, allDevices, (device) => {
            return device.url(self.baseUrl)
                .execute(xdmvc.injectEventLogger)
                .execute(function() {
                    return XDmvc.deviceId;
                }).then(ret => ret.value);
        }).then(function(deviceArray) {

            // Connect first device with all the others
            var connect = deviceArray.slice(1).map(idOther => {

                // Omit first id, loop over the others
                return deviceA.execute(function (id) {
                    XDmvc.connectTo(id);
                }, idOther);
            });

            return q.all(connect).then(() => {
                return deviceA.waitUntil(function () {
                    return deviceA.execute(xdmvc.getEventCounter).then(function (ret) {
                        return ret.value.XDconnection == self.devicesCount() - 1;
                    });
                });
            });
        });
    },

    devicesCount : function() {
        var self = this;
        return Object.keys(self.deviceOptions).length;
    }
}

module.exports = xdmvc;
