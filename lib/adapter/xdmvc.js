"use strict"

var assert = require('chai').assert;
var utility = require('../utility')
var q = require('q');


function debug() {

}


var xdmvc = {

    injectEventLogger: function() {

        var DEBUG = false;

        function EventLogger() {
            this.eventNames = ["XDdisconnection", "XDconnection", "XDdevice", "XDroles", "XDsync", "XDserverReady", "XDothersRolesChanged"];
            this.eventCounter = {};

            this.eventNames.forEach((function (event) {
                this.eventCounter[event] = 0;
                XDmvc.on(event, (function (sender) {
                    this.eventCounter[event]++;
                    if (DEBUG) {
                        console.log(event);
                        console.log(sender);
                        console.log(this.eventCounter);
                    }
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

        return deviceA.url(self.baseUrl).then(function () {
            debug('A: init');
        }).execute(function () {
            return 1 + 2;
        }).then(function (ret) {
            assert.equal(ret.value, 3);
        }).execute(xdmvc.injectEventLogger).then(function () {
            debug('A: injected event logger');
        }).getUrl().then(function (url) {

            var allButA = Object.keys(self.deviceOptions).filter(function (deviceName) {
                return deviceName != 'A';
            });
            return utility.multiAction(self.devices, allButA, function (device) {
                return device.url(url);
            }).then(function () {
                debug('init urls');

                return deviceA.waitUntil(function () {
                    return deviceA.execute(xdmvc.getEventCounter).then(function (ret) {
                        debug('A: got eventCounter: ');
                        debug(ret.value);
                        debug('devices.length:', self.devicesCount());
                        return ret.value.XDconnection == self.devicesCount() - 1;
                    });
                });
            });
        })
    },

    pairDevicesViaXDMVC: function() {
        var self = this;

        var deviceA = self.devices.select('A');

        // TODO wait for XD "initialized" event

        var allDevices = Object.keys(self.deviceOptions);

        return utility.multiAction(self.devices, allDevices, (device) => {
            return device.url(self.baseUrl).then(function () {
                debug('init');
            }).execute(xdmvc.injectEventLogger).then(function () {
                debug('injected event logger');
            }).execute(function() {
                return XDmvc.deviceId;
            }).then(ret => ret.value);
        }).then(function(vals) {

            // Connect first device with all the others
            var connect = vals.slice(1).map(idOther => {

                // Omit first id, loop over the others
                return deviceA.execute(function (id) {
                    XDmvc.connectTo(id);
                }, idOther);
            });

            return q.all(connect).then(() => {
                return deviceA.waitUntil(function () {
                    return deviceA.execute(xdmvc.getEventCounter).then(function (ret) {
                        debug('A: got eventCounter: ');
                        debug(ret.value);
                        debug('devices.length:', self.devicesCount());
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
