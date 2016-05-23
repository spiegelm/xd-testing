"use strict";

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

    test.deviceOptions = {};
    /**
     * @type {WebdriverIO.Client}
     */
    test.devices = {};
    test.baseUrl = "http://localhost:8080/maps.html";

    // Bind function to this reference
    test.adapter = require('../../lib/adapter/xdmvc');
    test.pairDevicesViaURL = test.adapter.pairDevicesViaURL.bind(test);
    test.pairDevicesViaXDMVC = test.adapter.pairDevicesViaXDMVC.bind(test);
    test.devicesCount = test.adapter.devicesCount.bind(test);
    var initWithDevices = utility.initWithDevices.bind(test);


    it('should pair via XDmvc.connectTo', function () {
        let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

        test.devices = initWithDevices(options)
            .url(test.baseUrl)
        test.devices = test.adapter.pairDevicesViaXDMVC(test.devices)
        return test.devices
            .selectById('A', deviceA => deviceA
                .execute(function () {
                    return XDmvc.getConnectedDevices().length;
                })
                .then(ret => assert.equal(ret.value, 1))
            )
            .end()
    });

    /**
     * @returns {WebdriverIO.Client}
     */
    var pairDevicesViaMapsGui = () => {
        var deviceA = test.devices.select('A');
        var deviceB = test.devices.select('B');

        var deviceIdA = deviceA.url(test.baseUrl)
            .execute(test.adapter.injectEventLogger)
            .execute(function () {
                return XDmvc.deviceId;
            }).then(function (ret) {
                return ret.value;
            });

        var deviceIdB = deviceB.url(test.baseUrl)
            .execute(test.adapter.injectEventLogger)
            .execute(function () {
                return XDmvc.deviceId;
            }).then(function (ret) {
                return ret.value;
            });

        return q.all([deviceIdA, deviceIdB]).then(function (vals) {
            // Both devices are ready
            var idA = vals[0];
            var idB = vals[1];

            return deviceA.click('#menu-button')
                .waitUntil(() => {
                    // Wait until the other device shows up in list
                    return deviceA.isVisible('//*[@id="availableDeviceList"]//*[@class="id"][text()="' + idB + '"]')
                        // If list does not contain device, refresh list and keep waiting
                        .then(isVisible => isVisible ? true : deviceA.click('#showDevices').then(() => false));
                }, test.async_timeout)
                // Click on device id
                .click('//*[@id="availableDeviceList"]//*[@class="id"][text()="' + idB + '"]')
                .waitUntil(function () {
                    // Wait for connection event
                    return deviceA.execute(test.adapter.getEventCounter).then(function (ret) {
                        return ret.value.XDconnection == 1;
                    });
                }, test.async_timeout);
        });
    };

    it('should pair via GUI', function () {
        var devices = {A: templates.devices.chrome(), B: templates.devices.chrome()};

        return initWithDevices(devices)
            .then(() => pairDevicesViaMapsGui())
            .then(() => test.devices.endAll());
    });


    describe('should sync the map center on mirrored devices', function () {

        setups.forEach(function (setup) {

            // Assemble setup name
            var setupName = Object.keys(setup.devices).map(function (key) {
                var dev = setup.devices[key];
                return dev.name;
            }).join(', ');

            it('on ' + setupName, function () {
                var test = this.test;

                var setupDevices = setup.devices;

                return initWithDevices(setupDevices)
                    .name(setupName)
                    .then(() => test.pairDevicesViaXDMVC())
                    .checkpoint('paired')
                    .selectById('A', deviceA => {

                        var lastXDSyncCounts;

                        var allDevices = Object.keys(test.deviceOptions);
                        var passiveDevices = allDevices.filter((id) => id != 'A');

                        return utility.multiAction(test.devices, passiveDevices, function (device) {
                            return device.execute(function () {
                                return eventLogger.eventCounter.XDsync;
                            }).then(ret => {
                                return {id: device.options.id, XDsync: ret.value};
                            });
                        }).then(function (values) {
                            // Store last sync counter
                            lastXDSyncCounts = {};
                            values.forEach(val => {
                                lastXDSyncCounts[val.id] = val.XDsync
                            });

                            // Adjust map location
                            return deviceA.execute(function () {
                                map.setCenter({lat: 47.3783569289, lng: 8.5487177968});
                            })
                                .checkpoint('set map center');
                        }).then(() => utility.multiAction(test.devices, passiveDevices, device => {
                            return device.waitUntil(() => device.execute(function (lastSyncCounter) {
                                    return eventLogger.eventCounter.XDsync > lastSyncCounter;
                                }, lastXDSyncCounts[device.options.id]), test.async_timeout)
                                .checkpoint('wait for synchronisation')
                        })).then(() => utility.multiAction(test.devices, passiveDevices, device =>
                            device.execute(function (id) {
                                return {
                                    id: id,
                                    XDsync: eventLogger.eventCounter.XDsync,
                                    map_lat: map.getCenter().lat(),
                                    map_lng: map.getCenter().lng()
                                };
                            }, device.options.id)
                        )).then(returns => {
                            return returns.map(ret => ret.value);
                        }).then(values => {

                            values.forEach(value => {
                                assert.isAbove(value.XDsync, lastXDSyncCounts[value.id], 'Number of syncs has not increased.');
                                assert.equal(value.map_lat.toFixed(10), 47.3783569289);
                                assert.equal(value.map_lng.toFixed(10), 8.5487177968);
                            });

                            return utility.multiAction(test.devices, allDevices, device => {
                                return device.pause(test.pauseTime).saveScreenshot(screenshotPath(test, device));
                            });
                        })
                    })
                    .checkpoint('end')
                    .then(() => test.devices.end())
            });
        });
    });

});
