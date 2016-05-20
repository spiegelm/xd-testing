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


var screenshotPath = function (test, device) {
    return './screenshots/' + test.fullTitle() + ' - ' + device.options.id + ' ' + device.options.name + '.png';
};

var config = require(process.cwd() + '/xd-testing.json');
normalizeConfig(config);
var setups = config['setups'];


describe('XD-MVC Gallery @large', function () {
    var self = this;

    // Set test timeout
    this.timeout(180 * 1000);
    self.async_timeout = utility.waitforTimeout = 30 * 1000;

    self.deviceOptions = {};
    self.devices = {};
    self.baseUrl = "http://localhost:8082/gallery.html";

    // Bind function to this reference
    self.adapter = require('../../lib/adapter/xdmvc');
    self.pairDevicesViaURL = self.adapter.pairDevicesViaURL.bind(self);
    self.pairDevicesViaXDMVC = self.adapter.pairDevicesViaXDMVC.bind(self);
    self.devicesCount = self.adapter.devicesCount.bind(self);
    var initWithDevices = utility.initWithDevices.bind(this);

    afterEach(function () {
        // Close browsers before completing a test
        return self.devices.end();
    });

    describe('eventLogger', function () {
        it('should count XDconnection events', function () {


            return initWithDevices({A: templates.devices.chrome(), B: templates.devices.chrome()}).then(function () {
                return self.pairDevicesViaURL();
            }).then(function () {
                var deviceA = self.devices.select('A');
                return deviceA
                    .execute(self.adapter.getEventCounter)
                    .then(function (ret) {
                        assert.equal(ret.value.XDconnection, self.devicesCount() - 1);
                    })
                    .then(() => self.devices.end());
            });
        });
    });

    it('should not share cookies across browser sessions', function () {

        return initWithDevices({A: templates.devices.chrome(), B: templates.devices.chrome()}).then(function () {
            return self.pairDevicesViaURL();
        }).then(function () {
            var deviceA = self.devices.select('A');
            var deviceB = self.devices.select('B');

            return deviceA
                .url(this.baseUrl)
                .then(function () {
                    return deviceB.url(self.baseUrl);
                })
                .setCookie({name: 'test_cookieA', value: 'A'})
                .getCookie('test_cookieA').then(function (cookie) {

                    assert.notEqual(cookie, null);
                    assert.equal(cookie.name, 'test_cookieA');
                    assert.equal(cookie.value, 'A');

                    return deviceB
                        .setCookie({name: 'test_cookieB', value: 'B'})
                        .getCookie('test_cookieB').then(function (cookie) {
                            assert.notEqual(cookie, null);
                            assert.equal(cookie.name, 'test_cookieB');
                            assert.equal(cookie.value, 'B');
                        })
                        .getCookie('test_cookieA').then(function (cookie) {
                            assert.equal(cookie, null);
                        });
                });
        });
    });

    it('should not share local storage across browser sessions', function () {
        var getItem = function (key) {
            return localStorage.getItem(key);
        };

        var setItem = function (key, value) {
            localStorage.setItem(key, value);
        };

        return initWithDevices({A: templates.devices.chrome(), B: templates.devices.chrome()}).then(function () {
            return self.pairDevicesViaURL();
        }).then(function () {
            var deviceA = self.devices.select('A');
            var deviceB = self.devices.select('B');

            return deviceA
                .url(self.baseUrl)
                .then(function () {
                    return deviceB.url(self.baseUrl);
                })
                .execute(setItem, 'test_storageA', 'A')
                .execute(getItem, 'test_storageA').then(function (ret) {
                    assert.equal(ret.value, 'A');

                    return deviceB.execute(getItem, 'test_storageA').then(function (ret) {
                        return assert.equal(ret.value, null);
                    });
                })
                .then(() => self.devices.end());
        });
    });

    describe('should show the selected image on the other devices', function () {

        setups.forEach(function(setup) {

            // Assemble setup name
            var setupName = Object.keys(setup.devices).map(key => setup.devices[key].name).join(', ');

            it('on ' + setupName, function () {

                var test = this.test;

                var imageUrlA;

                return initWithDevices(setup.devices)
                    .then(function () {
                        return self.pairDevicesViaURL();
                    })
                    .then(function () {
                        var deviceA = self.devices.select('A');

                        return deviceA.waitForVisible('h2.gallery-overview', self.async_timeout)
                            .click('//*[text()="Bike Tours"]')
                            .waitForVisible('#gallery img:nth-of-type(1)', self.async_timeout)
                            .click('#gallery img:nth-of-type(1)')
                            .waitForVisible('#image img', self.async_timeout)
                            .scroll(0, 10000)
                            .getAttribute('#image img', 'src').then(function (src) {
                                imageUrlA = src;
                            }).getUrl().then(function (url) {

                                // For all browsers but A
                                var allButA = Object.keys(self.deviceOptions).filter(function (deviceId) {
                                    return deviceId != 'A';
                                });

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
                    })
                    .then(() => self.devices.end());
            });
        });
    });
});
