"use strict";

/**
 * @type {Chai.Assert} assert
 */
var assert = require('chai').assert
var utility = require('../../lib/utility')
var xdTesting = require('../../lib/index')
var templates = xdTesting.templates

/**
 * @type {Q}
 */
var q = require('q');

/**
 * Resolve templates
 * @param config
 */
function normalizeConfig(config) {
    config['setups'].forEach(setup => {
        Object.keys(setup.devices).forEach(id => {
            var deviceConfig = setup.devices[id];
            if (typeof deviceConfig == "string" && templates.devices[deviceConfig]) {
                // Replace template reference
                setup.devices[id] = templates.devices[deviceConfig]();
            }
        })
    });
}

var config = require(process.cwd() + '/xd-testing.json');
normalizeConfig(config);
var setups = config['setups'];


describe('XD-MVC Maps @large', function() {
    var test = this;

    // Set test timeout
    test.timeout(180 * 1000);
    test.async_timeout = utility.waitforTimeout = 30 * 1000;
    test.pauseTime = 5 * 1000;

    /**
     * @type {WebdriverIO.Client}
     */
    test.baseUrl = "http://localhost:8080/maps.html";

    // Bind function to this reference
    test.adapter = require('../../lib/adapter/xdmvc');
    var initWithDevices = utility.initWithDevices.bind(test);


    it('should pair via XDmvc.connectTo', function () {
        let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

        let devices = initWithDevices(options)
            .url(test.baseUrl)
        devices = test.adapter.pairDevicesViaXDMVC(devices)
        return devices
            .selectById('A', deviceA => deviceA
                .then(() => console.log('get connected devices'))
                .execute(function () {
                    return XDmvc.getConnectedDevices().length;
                })
                .then(ret => assert.equal(ret.value, 1))
                .then(() => console.log('connected devices'))
            )
            .end()
    });

    /**
     * @param {WebdriverIO.Client} devices
     * @returns {WebdriverIO.Client}
     */
    var pairTwoDevicesViaMapsGui = devices => {
        return devices
            .selectAny(device => device
                // Pair any device with any other device
                .execute(test.adapter.injectEventLogger)
                .click('#menu-button')
                .waitUntil(() => {
                    // Wait until a device shows up in list
                    return device.isVisible('//*[@id="availableDeviceList"]//*[@class="id"]')
                        // If list does not contain device, refresh list and keep waiting
                        .then(isVisible => isVisible || device.click('#showDevices').then(() => false));
                }, test.async_timeout)
                // Click on device id
                .click('//*[@id="availableDeviceList"]//*[@class="id"]')
                .waitUntil(function () {
                    // Wait for connection event
                    return device.execute(test.adapter.getEventCounter).then(function (ret) {
                        return ret.value.XDconnection == 1;
                    });
                }, test.async_timeout)
            )
    }


    it('should pair via GUI', function () {
        let options = {A: templates.devices.chrome(), B: templates.devices.chrome()};

        let devices = initWithDevices(options)
            .url(test.baseUrl)

        return pairTwoDevicesViaMapsGui(devices)
            .end()
    });


    describe('should sync the map center on mirrored devices', function () {

        setups.forEach(function (setup) {

            // Assemble setup name
            var setupName = Object.keys(setup.devices).map(key => setup.devices[key].name).join(', ');

            it('on ' + setupName, function () {

                let deviceIds
                let allButA
                let lastXDSyncCounts = {}

                let devices = initWithDevices(setup.devices)
                    .url(test.baseUrl)
                    .name(setupName)
                return test.adapter.pairDevicesViaXDMVC(devices)
                    .checkpoint('paired')
                    .getDeviceIds().then(ret => deviceIds = ret.value)
                    .then(() => allButA = deviceIds.filter(id => id != 'A'))
                    .selectById(() => allButA, devices => devices
                        .forEach(device => device
                            .execute(function () {
                                return eventLogger.eventCounter.XDsync;
                            }).then(ret => {
                                return {id: device.options.id, XDsync: ret.value}
                            })
                        )
                        .then(function() {
                            // Store last sync counter
                            Object.keys(arguments).map(key => arguments[key])
                                .forEach(val => lastXDSyncCounts[val.id] = val.XDsync)
                            console.log('lastXDSyncCounts', lastXDSyncCounts)
                        })
                    )
                    .selectById('A', deviceA => deviceA
                        .execute(function () {
                            map.setCenter({lat: 47.3783569289, lng: 8.5487177968});
                        })
                        // TODO Wait until map tiles are loaded?
                        .checkpoint('set map center')
                    )
                    .selectById(() => allButA, otherDevices => otherDevices
                        .forEach(device => device
                            .waitUntil(() => device
                                .execute(function (lastSyncCounter) {
                                    return eventLogger.eventCounter.XDsync > lastSyncCounter;
                                }, lastXDSyncCounts[device.options.id]), test.async_timeout
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
                                assert.isAbove(value.XDsync, lastXDSyncCounts[value.id], 'Number of syncs has not increased.');
                                assert.approximately(value.map_lat, 47.3783569289, 0.0000000001)
                                assert.approximately(value.map_lng, 8.5487177968, 0.0000000001);
                            })
                            // TODO Wait until map tiles are loaded?
                        )
                    )
                    .checkpoint('sync')
                    .end()
            });
        });
    });

});
