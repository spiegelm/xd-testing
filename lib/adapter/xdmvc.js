"use strict"

var assert = require('chai').assert;
var utility = require('../utility')
var q = require('q');


var xdmvc = {

    injectEventLogger: function() {

        var EventLogger = function() {
            this.eventNames = ["XDdisconnection", "XDconnection", "XDdevice", "XDroles", "XDsync", "XDserverReady", "XDothersRolesChanged"];
            this.eventCounter = {};

            this.eventNames.forEach((function (event) {
                this.eventCounter[event] = 0;
                XDmvc.on(event, (function (sender) {
                    this.eventCounter[event]++;
                }).bind(this))
            }).bind(this));
        }

        window.eventLogger = window.eventLogger || new EventLogger();
        return 0;
    },

    getEventCounter: function() {
        return window.eventLogger.eventCounter;
    },

    pairDevicesViaURL: function(devices, baseUrl) {

        let allButA
        let urlA

        return devices
            .then(() => console.log('pairing..'))
            .getDeviceIds().then(ret => {
                console.log('ret', ret)
                allButA = ret.value.filter(function (deviceName) {
                    return deviceName != 'A'
                })
                console.log('allButA', allButA)
            })
            .selectById('A', deviceA => deviceA
                .url(baseUrl)
                .execute(function () {
                    return 1 + 2;
                })
                .then(ret => assert.equal(ret.value, 3))
                .then(() => console.log('inject event logger..'))
                .execute(xdmvc.injectEventLogger)
                .then(() => console.log('injected event logger'))
                .getUrl().then(url => urlA = url)
            )
            .selectById(() => allButA, otherDevices => otherDevices
                .url(urlA)
            )
            .selectById('A', deviceA => deviceA
                .waitUntil(() => deviceA
                    .then(() => console.log('get event counter'))
                    .execute(xdmvc.getEventCounter)
                    .then(ret => {
                        console.log('ret.value.XDconnection', ret.value.XDconnection)
                        return devices.getCount().then(count => {
                            console.log('count', count)
                            return ret.value.XDconnection == (count - 1)
                        })
                    })
                )
            )
            .then(() => console.log('paired'))
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
