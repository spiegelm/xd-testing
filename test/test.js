"use strict";

var assert = require('chai').assert;
var utility = require('../lib/utility')
var xdTesting = require('../lib/index')
var templates = require('../lib/templates');

/**
 * @type {Q}
 */
var q = require('q');

var debug = function() {
    if (false) {
        console.log.apply(console, arguments);
    }
};


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


var screenshotPath = function(test, device) {
    return './screenshots/' + test.fullTitle() + ' - ' + device.options.id + ' ' + device.options.name + '.png';
};

var config = require(process.cwd() + '/xd-testing.json');
normalizeConfig(config);
var setups = config['setups'];

describe('MultiDevice', function () {
    var self = this;

    // Set test timeout
    this.timeout(60 * 1000);
    utility.waitforTimeout = 30 * 1000;
    self.pauseTime = 5 * 1000;

    self.devices = {};
    self.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        return self.devices.endAll();
    });

    describe('WebdriverIO commands', function() {
        it('should be supported on multiple devices', function () {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '1')))
                ;
        });

        it.skip('should be supported on a single device', function () {
            var options = {A: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '1')))
                ;
        });
    })

    describe('selectById', function () {
        it('should act on the specified devices', function() {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .then(() => self.devices.selectById(['B', 'C'])
                    .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
                )
                ;
        });

        it('should not act on other devices', function() {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .then(() => self.devices.selectById(['B', 'C'])
                    .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
                ).then(() => self.devices.select('A')
                    .getText('#counter').then(textA => assert.equal(textA, '-'))
                )
                ;
        });
    });

    describe('getCount', function() {
        it ('should count a single device', function() {
            var options = {A: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .getCount().then((count) => {
                    assert.equal(count, 1);
                    assert.equal(Object.keys(arguments).length, 0)
                });
        });

        it ('should count two devices', function() {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .getCount().then((count) => {
                    assert.equal(count, 2);
                    assert.equal(Object.keys(arguments).length, 0)
                });
        });

        it ('should count several devices', function() {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome(), D: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .getCount().then((count) => {
                    assert.equal(count, 4);
                    assert.equal(Object.keys(arguments).length, 0)
                });
        });
    })
});

describe('XD-MVC Maps', function() {
    var self = this;

    // Set test timeout
    this.timeout(60 * 1000);
    self.async_timeout = utility.waitforTimeout = 30 * 1000;
    self.pauseTime = 5 * 1000;

    self.deviceOptions = {};
    self.devices = {};
    self.baseUrl = "http://localhost:8080/maps.html";

    // Bind function to this reference
    self.adapter = require('../lib/adapter/xdmvc');
    self.pairDevicesViaURL = self.adapter.pairDevicesViaURL.bind(self);
    self.pairDevicesViaXDMVC = self.adapter.pairDevicesViaXDMVC.bind(self);
    self.devicesCount = self.adapter.devicesCount.bind(self);
    var initWithDevices = utility.initWithDevices.bind(self);


    afterEach(function() {
        // Close browsers before completing a test
        return self.devices.end();
    });

    it('should pair via XDmvc.connectTo', function () {
        var devices = {A: templates.devices.chrome(), B: templates.devices.chrome()};
        return initWithDevices(devices).then(() => self.pairDevicesViaXDMVC()).then(() => {
            return self.devices.select('A').execute(function () {
                return XDmvc.getConnectedDevices().length;
            }).then(function (ret) {
                assert.equal(ret.value, 1);
            });
        });
    });

    var pairDevicesViaMapsGui = () => {
        var deviceA = self.devices.select('A');
        var deviceB = self.devices.select('B');

        var deviceIdA = deviceA.url(self.baseUrl).then(function () {
            debug('A: init');
        }).execute(self.adapter.injectEventLogger).then(function () {
            debug('A: injected event logger');
        }).execute(function () {
            return XDmvc.deviceId;
        }).then(function (ret) {
            return ret.value;
        });

        var deviceIdB = deviceB.url(self.baseUrl).then(function () {
            debug('B: init');
        }).execute(self.adapter.injectEventLogger).then(function () {
            debug('B: injected event logger');
        }).execute(function () {
            return XDmvc.deviceId;
        }).then(function (ret) {
            return ret.value;
        });

        // TODO wait until deviceB is registered, before loading deviceA
        // TODO or just repeat clicking the repeat button on the UI until the device appears

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
                        debug('A: got eventCounter: ');
                        debug(ret.value);
                        return ret.value.XDconnection == 1;
                    });
                }, self.async_timeout);
        });
    };

    it('should pair via GUI', function() {
        var devices = {A: templates.devices.chrome(), B: templates.devices.chrome()};

        return initWithDevices(devices).then(() => {
            return pairDevicesViaMapsGui();
        });
    });


    describe('should sync the map center on mirrored devices', function() {

        setups.forEach(function(setup) {

            // Assemble setup name
            var setupName = Object.keys(setup.devices).map(function (key) {
                var dev = setup.devices[key];
                return dev.name;
            }).join(', ');

            it('on ' + setupName, function () {
                var test = this.test;

                var devices = setup.devices;

                return initWithDevices(devices).then(() => self.pairDevicesViaXDMVC()).then(() => {
                    var deviceA = self.devices.select('A');

                    var lastXDSyncCounts;

                    var allDevices = Object.keys(self.deviceOptions);
                    var passiveDevices = allDevices.filter((id) => id != 'A');

                    return utility.multiAction(self.devices, passiveDevices, function(device) {
                        return device.execute(function() {
                            return eventLogger.eventCounter.XDsync;
                        }).then(ret => {
                            return {id: device.options.id, XDsync: ret.value};
                        });
                    }).then(function(values) {
                        // Store last sync counter
                        lastXDSyncCounts = {};
                        values.forEach(val => { lastXDSyncCounts[val.id] = val.XDsync });

                        // Adjust map location
                        return deviceA.execute(function () {
                            map.setCenter({lat: 47.3783569289, lng: 8.5487177968});
                        });
                    }).then(() => utility.multiAction(self.devices, passiveDevices, device => {
                        return device.waitUntil(() => device.execute(function (lastSyncCounter) {
                            return eventLogger.eventCounter.XDsync > lastSyncCounter;
                        }, lastXDSyncCounts[device.options.id]), self.async_timeout)
                    })).then(() => utility.multiAction(self.devices, passiveDevices, device =>
                        device.execute(function(id) {
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
                    });
                });
            });
        });
    });

});

describe('XD-MVC Gallery', function() {
    var self = this;

    // Set test timeout
    this.timeout(60 * 1000);
    self.async_timeout = utility.waitforTimeout = 30 * 1000;

    self.deviceOptions = {};
    self.devices = {};
    self.baseUrl = "http://localhost:8082/gallery.html";

    // Bind function to this reference
    self.adapter = require('../lib/adapter/xdmvc');
    self.pairDevicesViaURL = self.adapter.pairDevicesViaURL.bind(self);
    self.pairDevicesViaXDMVC = self.adapter.pairDevicesViaXDMVC.bind(self);
    self.devicesCount = self.adapter.devicesCount.bind(self);
    var initWithDevices = utility.initWithDevices.bind(this);

    afterEach(function() {
        // Close browsers before completing a test
        return self.devices.end();
    });

    describe('eventLogger', function() {
        it ('should count XDconnection events', function() {


            return initWithDevices({A: templates.devices.chrome(), B: templates.devices.chrome()}).then(function() {
                return self.pairDevicesViaURL();
            }).then(function() {
                var deviceA = self.devices.select('A');
                return deviceA.execute(self.adapter.getEventCounter).then(function(ret) {
                    debug('A: got eventCounter: ');
                    debug(ret.value);
                    assert.equal(ret.value.XDconnection, self.devicesCount() - 1);
                });
            });
        });
    });

    it('should not share cookies across browser sessions', function () {

        return initWithDevices({A: templates.devices.chrome(), B: templates.devices.chrome()}).then(function() {
            return self.pairDevicesViaURL();
        }).then(function() {
            var deviceA = self.devices.select('A');
            var deviceB = self.devices.select('B');

            return deviceA.url(this.baseUrl).then(function () {
                return deviceB.url(self.baseUrl);
            }).setCookie({name: 'test_cookieA', value: 'A'})
            .getCookie('test_cookieA').then(function (cookie) {

                assert.notEqual(cookie, null);
                assert.equal(cookie.name, 'test_cookieA');
                assert.equal(cookie.value, 'A');

                return deviceB.setCookie({name: 'test_cookieB', value: 'B'})
                .getCookie('test_cookieB').then(function (cookie) {

                    assert.notEqual(cookie, null);
                    assert.equal(cookie.name, 'test_cookieB');
                    assert.equal(cookie.value, 'B');

                }).getCookie('test_cookieA').then(function (cookie) {
                    assert.equal(cookie, null);
                });
            });
        });
    });

    it('should not share local storage across browser sessions', function () {
        var getItem = function(key) {
            return localStorage.getItem(key);
        };

        var setItem = function(key, value) {
            localStorage.setItem(key, value);
        };

        return initWithDevices({A: templates.devices.chrome(), B: templates.devices.chrome()}).then(function() {
            return self.pairDevicesViaURL();
        }).then(function() {
            var deviceA = self.devices.select('A');
            var deviceB = self.devices.select('B');

            return deviceA.url(self.baseUrl).then(function () {
                return deviceB.url(self.baseUrl);
            }).execute(setItem, 'test_storageA', 'A')
            .execute(getItem, 'test_storageA').then(function (ret) {
                assert.equal(ret.value, 'A');

                return deviceB.execute(getItem, 'test_storageA').then(function (ret) {
                    return assert.equal(ret.value, null);
                });
            });
        });
    });

    describe('should show the selected image on the other devices', function () {

        setups.forEach(function(setup) {

            // Assemble setup name
            var setupName = Object.keys(setup.devices).map(key => setup.devices[key].name).join(', ');

            it('on ' + setupName, function() {

                var test = this.test;

                var imageUrlA;

                return initWithDevices(setup.devices).then(function() {
                    return self.pairDevicesViaURL();
                }).then(function() {
                    var deviceA = self.devices.select('A');

                    return deviceA.waitForVisible('h2.gallery-overview', self.async_timeout).then(function () {
                        //debug('A: h2.gallery-overview is visible');
                    }).click('//*[text()="Bike Tours"]').then(function () {
                        //debug('A: clicked Bike Tours');
                    }).waitForVisible('#gallery img:nth-of-type(1)', self.async_timeout).then(function () {
                        //debug('A: first image is visible');
                    }).click('#gallery img:nth-of-type(1)').then(function () {
                        //debug('A: clicked first image in galery');
                    }).waitForVisible('#image img', self.async_timeout).then(function () {
                        //debug('A: #image img is visible');
                    }).scroll(0, 10000).then(function () {
                        //debug('A: scrolled down to the end');
                    }).getAttribute('#image img', 'src').then(function (src) {
                        imageUrlA = src;
                        //debug('A: image src ' + src);
                    }).getUrl().then(function (url) {

                        // For all browsers but A
                        var allButA = Object.keys(self.deviceOptions).filter(function (deviceId) {
                            return deviceId != 'A';
                        });

                        debug(allButA);

                        return utility.multiAction(self.devices, allButA, function (device) {
                            return device.waitForVisible('#image img', self.async_timeout);
                        }).then(function () {
                            return utility.multiAction(self.devices, allButA, function (device) {
                                return device.getAttribute('#image img', 'src');
                            });
                        }).then(function (srcs) {
                            Object.keys(srcs).forEach(function (key) {
                                var src = srcs[key];
                                assert.equal(src, imageUrlA);
                            });

                            return utility.multiAction(self.devices, allButA, function (device) {
                                return device.saveScreenshot(screenshotPath(test, device));
                            });
                        });
                    }).saveScreenshot(screenshotPath(test, deviceA));
                });
            });
        });
    });
});
