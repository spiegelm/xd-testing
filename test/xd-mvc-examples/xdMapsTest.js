"use strict";

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = xdTesting.templates
/**
 * @type {Q}
 */
var q = require('q')


describe('XD-MVC Maps @large', function () {
    var test = this;

    // Set test timeout
    test.timeout(180 * 1000)
    test.pauseTime = 5 * 1000

    xdTesting.baseUrl = "http://localhost:8080/maps.html"
    xdTesting.appFramework = xdTesting.adapter.xdmvc

    /**
     * @returns {WebdriverIO.Client}
     */
    xdTesting.appFramework.prototype.pairTwoDevicesViaMapsGui = function() {
        return this.devices
            .selectAny(device => {
                return device
                    // Pair any device with any other device
                    .app().injectEventLogger()
                    .click('#menu-button')
                    .waitUntil(() => {
                        return device
                            // Wait until an other device shows up in list
                            .isVisible('//*[@id="availableDeviceList"]//*[@class="id"]')
                            // If list does not contain other devices, refresh list and keep waiting
                            .then(isVisible => isVisible || device.click('#showDevices').then(() => {
                                return false
                            }))
                    })
                    // Click on device id
                    .click('//*[@id="availableDeviceList"]//*[@class="id"]')
                    .waitUntil(() => device
                    // Wait for connection event
                        .app().getEventCounter().then(counter => counter['XDconnection'] === 1))
            })
    }

    it('should pair via XDmvc.connectTo', function () {
        let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

        return xdTesting.multiremote(options).init()
            .app().pairDevicesViaXDMVC()
            .selectById('A', deviceA => deviceA
                .execute(function () {
                    return XDmvc.getConnectedDevices().length
                })
                .then(ret => assert.equal(ret.value, 1))
            )
            .end()
    })


    it('should pair via GUI', function () {
        let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

        return xdTesting.multiremote(options).init()
            .url(test.baseUrl)
            .app().pairTwoDevicesViaMapsGui()
            .end()
    })


    describe('should sync the map center on mirrored devices', function () {

        xdTesting.loadSetups().forEach(function (setup) {

            // Assemble setup name
            var setupName = Object.keys(setup.devices).map(key => setup.devices[key].name).join(', ')

            it('on ' + setupName, function () {

                let lastXDSyncCounts

                return xdTesting.multiremote(setup.devices).init()
                    .url(test.baseUrl)
                    .name(setupName)
                    .app().pairDevicesViaXDMVC()
                    .checkpoint('paired')
                    .selectById('A',
                        // Omit callback for A
                        () => {},
                        // Use the complement selection
                        allButA => allButA
                            .forEach(device => device
                                .execute(function () {
                                    return eventLogger.eventCounter.XDsync;
                                }).then(ret => {
                                    return {id: device.options.id, XDsync: ret.value}
                                })
                            )
                            .then(function() {
                                // Store last sync counter
                                lastXDSyncCounts = {}
                                Object.keys(arguments).map(key => arguments[key])
                                    .forEach(val => lastXDSyncCounts[val.id] = val.XDsync)
                            })
                    )
                    .selectById('A',
                        deviceA => deviceA
                            .execute(function () {
                                map.setCenter({lat: 47.3783569289, lng: 8.5487177968})
                            })
                            // TODO Wait until map tiles are loaded?
                            .checkpoint('set map center'),
                        allButA => allButA
                            .forEach(device => device
                                .waitUntil(() => device
                                    .execute(function (lastSyncCounter) {
                                        return eventLogger.eventCounter.XDsync > lastSyncCounter
                                    }, lastXDSyncCounts[device.options.id])
                                )
                                .checkpoint('wait for synchronisation')
                                .execute(function (id) {
                                    return {
                                        id: id,
                                        XDsync: eventLogger.eventCounter.XDsync,
                                        map_lat: map.getCenter().lat(),
                                        map_lng: map.getCenter().lng()
                                    };
                                }, device.options.id)
                                .then(ret => {
                                    let value = ret.value
                                    assert.isAbove(value.XDsync, lastXDSyncCounts[value.id], 'Number of syncs has not increased.')
                                    assert.approximately(value.map_lat, 47.3783569289, 0.0000000001)
                                    assert.approximately(value.map_lng, 8.5487177968, 0.0000000001)
                                })
                                // TODO Wait until map tiles are loaded?
                            )
                    )
                    .checkpoint('sync')
                    .end()
            })
        })
    })
})
