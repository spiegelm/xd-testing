"use strict";

var assert = require('chai').assert
var utility = require('../../lib/utility')
var templates = require('../../lib/templates')

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


var screenshotPath = function (test, device) {
    return './screenshots/' + test.fullTitle() + ' - ' + device.options.id + ' ' + device.options.name + '.png';
};

var config = require(process.cwd() + '/xd-testing.json');
normalizeConfig(config);
var setups = config['setups'];


describe('XD-MVC Maps @large', function() {
    var self = this;

    // Set test timeout
    this.timeout(180 * 1000);
    self.async_timeout = utility.waitforTimeout = 30 * 1000;
    self.pauseTime = 5 * 1000;

    self.deviceOptions = {};
    /**
     * @type {WebdriverIO.Client}
     */
    self.devices = {};
    self.baseUrl = "http://localhost:8080/maps.html";

    // Bind function to this reference
    self.adapter = require('../../lib/adapter/xdmvc');
    self.pairDevicesViaURL = self.adapter.pairDevicesViaURL.bind(self);
    self.pairDevicesViaXDMVC = self.adapter.pairDevicesViaXDMVC.bind(self);
    self.devicesCount = self.adapter.devicesCount.bind(self);
    var initWithDevices = utility.initWithDevices.bind(self);


    afterEach(function() {
        // Close browsers before completing a test
        if (self.devices && self.devices.endAll) {
            return self.devices.endAll();
        }
    });

    it('should pair via XDmvc.connectTo', function () {
        var devices = {A: templates.devices.chrome(), B: templates.devices.chrome()};
        return initWithDevices(devices)
            .then(() => self.pairDevicesViaXDMVC())
            .then(() => self.devices.select('A')
                .execute(function () {
                    return XDmvc.getConnectedDevices().length;
                })
                .then(function (ret) {
                    assert.equal(ret.value, 1);
                })
            )
            .then(() => self.devices.end());
    });

    /**
     * @returns {WebdriverIO.Client}
     */
    var pairDevicesViaMapsGui = () => {
        var deviceA = self.devices.select('A');
        var deviceB = self.devices.select('B');

        var deviceIdA = deviceA.url(self.baseUrl)
            .execute(self.adapter.injectEventLogger)
            .execute(function () {
                return XDmvc.deviceId;
            }).then(function (ret) {
                return ret.value;
            });

        var deviceIdB = deviceB.url(self.baseUrl)
            .execute(self.adapter.injectEventLogger)
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
                }, self.async_timeout)
                // Click on device id
                .click('//*[@id="availableDeviceList"]//*[@class="id"][text()="' + idB + '"]')
                .waitUntil(function () {
                    // Wait for connection event
                    return deviceA.execute(self.adapter.getEventCounter).then(function (ret) {
                        return ret.value.XDconnection == 1;
                    });
                }, self.async_timeout);
        });
    };

    it('should pair via GUI', function () {
        var devices = {A: templates.devices.chrome(), B: templates.devices.chrome()};

        return initWithDevices(devices)
            .then(() => pairDevicesViaMapsGui())
            .then(() => self.devices.endAll());
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
                    .then(() => self.pairDevicesViaXDMVC())
                    .checkpoint('paired')
                    .selectById('A', deviceA => {

                        var lastXDSyncCounts;

                        var allDevices = Object.keys(self.deviceOptions);
                        var passiveDevices = allDevices.filter((id) => id != 'A');

                        return utility.multiAction(self.devices, passiveDevices, function (device) {
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
                        }).then(() => utility.multiAction(self.devices, passiveDevices, device => {
                            return device.waitUntil(() => device.execute(function (lastSyncCounter) {
                                    return eventLogger.eventCounter.XDsync > lastSyncCounter;
                                }, lastXDSyncCounts[device.options.id]), self.async_timeout)
                                .checkpoint('wait for synchronisation')
                        })).then(() => utility.multiAction(self.devices, passiveDevices, device =>
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

                            return utility.multiAction(self.devices, allDevices, device => {
                                return device.pause(self.pauseTime).saveScreenshot(screenshotPath(test, device));
                            });
                        })
                    })
                    .checkpoint('end')
                    .then(() => self.devices.end())
            });
        });
    });

});
