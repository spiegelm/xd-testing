"use strict";

var assert = require('assert');
var webdriverio = require('webdriverio');
var q = require('q');

var debug = function() {
    if (false) {
        console.log.apply(console, arguments);
    }
};

var injectEventLogger = function() {

    var DEBUG = false;

    function EventLogger() {
        this.eventNames = ["XDdisconnection", "XDconnection", "XDdevice", "XDroles", "XDsync", "XDserverReady", "XDothersRolesChanged"];
        this.eventCounter = {};

        this.eventNames.forEach((function (event) {
            this.eventCounter[event] = 0;
            XDmvc.on(event, (function (sender) {
                this.eventCounter[event]++;
                if (DEBUG) {
                    console.log(event);
                    console.log(sender);
                    console.log(this.eventCounter);
                }
            }).bind(this))
        }).bind(this));
    }

    window.eventLogger = new EventLogger();
    return 0;
};

var getEventCounter = function() {
    return window.eventLogger.eventCounter;
};

var utility = {
    setupConnectedBrowsers: function() {
        var self = this;

        var deviceA = self.devices.select('A');

        return deviceA.url(self.baseUrl).then(function () {
            debug('A: init');
        }).execute(function () {
            return 1 + 2;
        }).then(function (ret) {
            assert.equal(ret.value, 3);
        }).execute(injectEventLogger).then(function () {
            debug('A: injected event logger');
        }).getUrl().then(function (url) {

            var allButA = Object.keys(self.deviceOptions).filter(function (deviceName) {
                return deviceName != 'A';
            });
            return multiAction(self.devices, allButA, function (device) {
                return device.url(url);
            }).then(function () {
                debug('init urls');

                return deviceA.waitUntil(function () {
                    return deviceA.execute(getEventCounter).then(function (ret) {
                        debug('A: got eventCounter: ');
                        debug(ret.value);
                        debug('devices.length:', self.devicesCount());
                        return ret.value.XDconnection == self.devicesCount() - 1;
                    });
                });
            });
        })
    },

    devicesCount : function() {
        var self = this;
        return Object.keys(self.deviceOptions).length;
    }
};


/**
 * Executes callback on devices matching deviceNames.
 * Returns an promise.
 * @param devices
 * @param deviceIds
 * @param callback
 * @returns
 */
function multiAction (devices, deviceIds, callback) {
    var promises = [];
    debug(deviceIds);
    deviceIds.forEach(function(id) {
        var device = devices.select(id);
        debug('multiAction ' + id + ' ' + device.options.id, device.options);

        promises.push(callback(device));
    });
    return q.all(promises);
}

describe('XD-MVC Example Gallery', function() {
    var self = this;

    // Set test timeout
    this.timeout(15 * 1000);

    self.deviceOptions = {};
    self.devices = {};
    self.baseUrl = "http://me.local:8082/gallery.html";

    // Bind function to this reference
    self.setupConnectedBrowsers = utility.setupConnectedBrowsers.bind(self);
    self.devicesCount = utility.devicesCount.bind(self);

    var initWithDevices = function(devices) {

        // Store id into device
        Object.keys(devices).forEach(function(id) {
            var dev = devices[id];
            debug(id, dev);
            dev["id"] = id;
            debug(id, dev);
        });

        debug(devices);

        self.deviceOptions = devices;

        // New browser instance with WebdriverIO
        self.devices = webdriverio.multiremote(self.deviceOptions);
        //attachCustomFunctions(this.devices);

        var tileWidth = Math.floor(1600 / self.devicesCount());

        return self.devices.init()
            .timeoutsAsyncScript(5 * 1000)
            .windowHandleSize({width: tileWidth, height: 600})
            .then(function () {
                // Align windows on screen
                var x = 0;
                Object.keys(self.deviceOptions).forEach(function (deviceName) {
                    self.devices.select(deviceName).windowHandlePosition({x: x, y: 0});
                    x += tileWidth;
                });

                // legacy variables
                self.deviceA = self.devices.select('A');
                self.deviceB = self.devices.select('B');
            });
    }.bind(this);


    beforeEach(function () {
    });

    afterEach(function() {
        // Close browser before completing a test
        return self.devices.end();
    });

    describe('eventLogger', function() {
        it ('should count XDconnection events', function() {

            return initWithDevices({A: templates.windows_chrome(), B: templates.windows_chrome()}).then(function() {
                return self.setupConnectedBrowsers();
            }).then(function() {
                return self.deviceA.execute(getEventCounter).then(function(ret) {
                    debug('A: got eventCounter: ');
                    debug(ret.value);
                    assert.equal(ret.value.XDconnection, self.devicesCount() - 1);
                });
            });
        });
    });

    it('should not share cookies across browser sessions', function () {

        return initWithDevices({A: templates.windows_chrome(), B: templates.windows_chrome()}).then(function() {
            return self.setupConnectedBrowsers();
        }).then(function() {
            return self.deviceA.url(this.baseUrl).then(function () {
                return self.deviceB.url(self.baseUrl);
            }).setCookie({name: 'test_cookieA', value: 'A'})
            .getCookie('test_cookieA').then(function (cookie) {

                assert.notEqual(cookie, null);
                assert.equal(cookie.name, 'test_cookieA');
                assert.equal(cookie.value, 'A');

                return self.deviceB.setCookie({name: 'test_cookieB', value: 'B'})
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

        return initWithDevices({A: templates.windows_chrome(), B: templates.windows_chrome()}).then(function() {
            return self.setupConnectedBrowsers();
        }).then(function() {
            return self.deviceA.url(self.baseUrl).then(function () {
                return self.deviceB.url(self.baseUrl);
            }).execute(setItem, 'test_storageA', 'A')
            .execute(getItem, 'test_storageA').then(function (ret) {
                assert.equal(ret.value, 'A');

                return self.deviceB.execute(getItem, 'test_storageA').then(function (ret) {
                    return assert.equal(ret.value, null);
                });
            });
        });
    });

    var templates = {
        windows_chrome: function() {
            // Generate a new object
            return {
                name: 'Chrome (Win)',
                desiredCapabilities: {browserName: 'chrome'}
            };
        },
        nexus4: function() {
            // Generate a new object
            return {
                name: 'Nexus 4',
                desiredCapabilities: {browserName: 'chrome'}
            }
        }
    };

    describe('should show the selected image on the other devices', function () {

        var setups = [
            {devices: {A: templates.windows_chrome(), B: templates.nexus4()}},
            {devices: {A: templates.windows_chrome(), B: templates.nexus4(), C: templates.nexus4()}}
        ];

        setups.forEach(function(setup) {

            // Assemble setup name
            var setupName = Object.keys(setup.devices).map(function(key) {
                var dev = setup.devices[key];
                return dev.name;
            }).join(', ');

            it('on ' + setupName, function() {

                var test = this.test;

                var i = 0;
                var screenshotPath = function(device) {
                    return './screenshots/' + test.fullTitle() + ' - ' + device.options.id + ' ' + device.options.name + '.png';
                };

                var imageUrlA;

                return initWithDevices(setup.devices).then(function() {
                    return self.setupConnectedBrowsers();
                }).then(function() {
                    return self.deviceA.waitForVisible('h2.gallery-overview', 5000).then(function () {
                        //debug('A: h2.gallery-overview is visible');
                    }).click('//*[text()="Bike Tours"]').then(function () {
                        //debug('A: clicked Bike Tours');
                    }).waitForVisible('#gallery img:nth-of-type(1)').then(function () {
                        //debug('A: first image is visible');
                    }).click('#gallery img:nth-of-type(1)').then(function () {
                        //debug('A: clicked first image in galery');
                    }).waitForVisible('#image img').then(function () {
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

                        return multiAction(self.devices, allButA, function (device) {
                            return device.waitForVisible('#image img', 3000);
                        }).then(function () {
                            return multiAction(self.devices, allButA, function (device) {
                                return device.getAttribute('#image img', 'src');
                            });
                        }).then(function (srcs) {
                            Object.keys(srcs).forEach(function (key) {
                                var src = srcs[key];
                                assert.equal(src, imageUrlA);
                            });

                            return multiAction(self.devices, allButA, function (device) {
                                return device.saveScreenshot(screenshotPath(device)).then(function() {
                                    assert.equal(typeof err, "undefined");
                                    debug(device.options.id + ': save screenshot');
                                });
                            });
                        });
                    }).saveScreenshot(screenshotPath(self.deviceA)).then(function() {
                        assert.equal(typeof err, "undefined");
                        debug(self.deviceA.options.id + ': save screenshot');
                    });
                });
            });
        });
    });
});