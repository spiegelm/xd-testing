"use strict"

var q = require('q');


class xdmvc {

    /**
     * @param {WebdriverIO.Client} devices
     */
    constructor(devices) {
        /**
         * @type {WebdriverIO.Client}
         */
        this.devices = devices
    }

    static get hooks() {
        return {
            'url': {
                before: null,
                /**
                 * @param {WebdriverIO.Client} devices
                 */
                after: function(devices) {
                    return devices.app.injectEventLogger()
                }
            }
        }
    }

    /**
     * @returns {WebdriverIO.Client}
     */
    injectEventLogger() {
        return this.devices.execute(function() {

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
        })
    }

    /**
     * @returns {WebdriverIO.Client<RawResult<any>>}
     */
    getEventCounter() {
        return this.devices.execute(function() {
            return window.eventLogger.eventCounter;
        })
    }

    /**
     * Pair devices by loading the url from device A on all other devices.
     * @param {string} baseUrl
     * @returns {WebdriverIO.Client}
     */
    pairDevicesViaURL(baseUrl) {
        let urlA

        return this.devices
        // TODO select any device, avoid specific ids
            .selectById('A',
                deviceA => deviceA
                    .url(baseUrl)
                    .execute(xdmvc.injectEventLogger)
                    .getUrl().then(url => urlA = url),
                otherDevices => otherDevices
                    .url(urlA)
            )
            .selectById('A', deviceA => deviceA
                .waitUntil(() => deviceA
                    .app.getEventCounter()
                    .then(ret => devices.getCount().then(count => ret.value.XDconnection === (count - 1)))
                )
            )
    }

    /**
     * Pair device A with all other devices.
     * @returns {WebdriverIO.Client}
     */
    pairDevicesViaXDMVC() {
        let sessionIDsWithoutA = []

        return this.devices
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
                        .execute(this.getEventCounter)
                        .then(ret => devices.getCount().then(count => ret.value.XDconnection == count - 1))
                    )
                )
            })
    }
}

module.exports = xdmvc;
