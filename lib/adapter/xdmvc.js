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

    getCommandHooks() {
        return {
            'url': {
                after: () => this.devices
                    .app().injectEventLogger()
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
     * @returns {WebdriverIO.Client<RawResult<Object>>}
     */
    getEventCounter() {
        return this.devices.execute(function() {
            return window.eventLogger.eventCounter;
        }).then(function() {
            return Array.prototype.slice.call(arguments).map(counter => counter.value)
        })
    }

    /**
     * @param {string} eventType
     * @returns {WebdriverIO.Client}
     */
    waitForEvent(eventType) {
        let lastCount
        return this
            .getEventCounter().then(counter => lastCount = counter[eventType])
            .waitUntil(() => {
                return this.getEventCounter().then(counter => {
                    return counter[eventType] === lastCount + 1
                })
            })
    }

    /**
     * @param {string} eventType
     * @param {number} count
     * @returns {WebdriverIO.Client}
     */
    waitForEventCount(eventType, count) {
        return this.devices
            .waitUntil(() => {
                return this.getEventCounter().then(counter => {
                    return counter[eventType] === count
                })
            })
    }

    getConnectedDeviceCount() {
        return this.devices
            .execute(function () {
                return XDmvc.getConnectedDevices().length
            })
            .then(function() {
                let args = Array.prototype.slice.call(arguments)
                return args.map(ret => ret.value)
            })
    }

    /**
     * @param {number} count
     * @returns {WebdriverIO.Client}
     */
    waitForConnectedDeviceCount(count) {
        return this.devices
            .waitUntil(() => this.getConnectedDeviceCount()
                .then(ret => ret === count)
            )
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
                    .app().injectEventLogger()
                    .getUrl().then(url => urlA = url),
                otherDevices => otherDevices
                    .url(urlA)
            )
            .selectById('A', deviceA => deviceA
                .waitUntil(() => deviceA
                    .app().getEventCounter()
                    .then(counter => this.devices
                        .getCount().then(count => counter['XDconnection'] === (count - 1))
                    )
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
            .app().injectEventLogger()
            // TODO select any device, avoid specific ids
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
                        .app().getEventCounter()
                        .then(counter => this.devices
                            .getCount().then(count => counter['XDconnection'] == count - 1))
                    )
                )
            })
    }
}

module.exports = xdmvc;
