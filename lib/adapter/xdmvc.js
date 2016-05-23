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

    /**
     * @param {WebdriverIO.Client} devices
     * @param {string} baseUrl
     * @returns {WebdriverIO.Client}
     */
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

    /**
     * @param {WebdriverIO.Client} devices
     * @returns {Q.Promise<U>}
     */
    pairDevicesViaXDMVC: function(devices) {

        // TODO wait for XD "initialized" event?

        let sessionIDsWithoutA = []
        let allButA = []

        return devices
            .execute(xdmvc.injectEventLogger)
            .getDeviceIds().then(ret => {
                let ids = ret.value
                allButA = ids.filter(id => id != 'A')
            })
            .selectById(() => allButA, allButA => allButA
                .forEach(device => device
                    .execute(function() {
                        return XDmvc.deviceId
                    })
                    .then(ret => sessionIDsWithoutA.push(ret.value))
                )
            )
            .selectById('A', deviceA => {
                // Connect device A with all other devices
                return q.all(
                    sessionIDsWithoutA.map(otherId => deviceA
                        .execute(function (id) {
                            XDmvc.connectTo(id);
                        }, otherId)
                    )
                ).then(() => deviceA
                    .waitUntil(() => deviceA
                        .execute(xdmvc.getEventCounter)
                        .then(ret => devices.getCount().then(count => ret.value.XDconnection == count - 1))
                    )
                )
            })
    },

    devicesCount : function() {
        var self = this;
        return Object.keys(self.deviceOptions).length;
    }
}

module.exports = xdmvc;
