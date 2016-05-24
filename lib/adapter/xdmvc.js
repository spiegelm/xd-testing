"use strict"

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert;
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
        let urlA

        return devices
            .selectById('A',
                deviceA => deviceA
                    .url(baseUrl)
                    .execute(function () {
                        return 1 + 2;
                    })
                    .then(ret => assert.equal(ret.value, 3))
                    .execute(xdmvc.injectEventLogger)
                    .getUrl().then(url => urlA = url),
                otherDevices => otherDevices
                    .url(urlA)
            )
            .selectById('A', deviceA => deviceA
                .waitUntil(() => deviceA
                    .execute(xdmvc.getEventCounter)
                    .then(ret => devices.getCount().then(count => ret.value.XDconnection === (count - 1)))
                )
            )
    },

    /**
     * @param {WebdriverIO.Client} devices
     * @returns {Q.Promise<U>}
     */
    pairDevicesViaXDMVC: function(devices) {
        let sessionIDsWithoutA = []

        return devices
            .execute(xdmvc.injectEventLogger)
            .selectById('A',
                () => { },
                allButA => allButA
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
