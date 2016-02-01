"use strict";

var assert = require('assert');
var webdriverio = require('webdriverio');
var q = require('q');

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
            console.log('A: init');
        }).execute(function () {
            return 1 + 2;
        }).then(function (ret) {

            console.log('A: executed script');
            console.log(ret.value);
            assert.equal(ret.value, 3);
        }).execute(injectEventLogger).then(function () {
            console.log('A: injected event logger');
        }).getUrl().then(function (url) {

            var allButA = Object.keys(self.deviceOptions).filter(function (deviceName) {
                return deviceName != 'A';
            });
            return multiAction(self.devices, allButA, function (device) {
                return device.url(url);
                //return self.deviceB.url(url).then(function () {
            }).then(function () {
                console.log('init urls');

                return deviceA.waitUntil(function () {
                    return deviceA.execute(getEventCounter).then(function (ret) {
                        console.log('A: got eventCounter: ');
                        console.log(ret.value);
                        console.log('devices.length: ' + self.devicesCount());
                        return ret.value.XDconnection == self.devicesCount() - 1;
                        //return ret.value.XDconnection == devicesButA.count();
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
 * @param deviceNames
 * @param callback
 * @returns
 */
function multiAction (devices, deviceNames, callback) {
    var promises = [];
    deviceNames.forEach(function(name) {
        promises.push(callback(devices.select(name)));
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

            return initWithDevices({A: templates.windows_chrome, B: templates.windows_chrome}).then(function() {
                return self.setupConnectedBrowsers();
            }).then(function() {
                return self.deviceA.execute(getEventCounter).then(function(ret) {
                    console.log('A: got eventCounter: ');
                    console.log(ret.value);
                    assert.equal(ret.value.XDconnection, self.devicesCount() - 1);
                });
            });
        });
    });

    it('should not share cookies across browser sessions', function () {

        return initWithDevices({A: templates.windows_chrome, B: templates.windows_chrome}).then(function() {
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

        return initWithDevices({A: templates.windows_chrome, B: templates.windows_chrome}).then(function() {
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
        windows_chrome: {
            name: 'Chrome (Win)',
            desiredCapabilities: {browserName: 'chrome'}
        },
        nexus4: {
            name: 'Nexus 4',
            desiredCapabilities: {browserName: 'chrome'}
        }
    };

    describe('should show the selected image on the other devices', function () {

        var setups = [
            {devices: {A: templates.windows_chrome, B: templates.nexus4}},
            {devices: {A: templates.windows_chrome, B: templates.nexus4, C: templates.nexus4}}
        ];

        setups.forEach(function(setup) {

            // Assemble setup name
            var setupName = Object.keys(setup.devices).map(function(key) {
                var dev = setup.devices[key];
                return dev.name;
            }).join(', ');

            it('on ' + setupName, function() {

                var imageUrlA;

                return initWithDevices(setup.devices).then(function() {
                    return self.setupConnectedBrowsers();
                }).then(function() {
                    return self.deviceA.waitForVisible('h2.gallery-overview', 5000).then(function () {
                        console.log('A: h2.gallery-overview is visible');
                    }).click('//*[text()="Bike Tours"]').then(function () {
                        console.log('A: clicked Bike Tours');
                    }).waitForVisible('#gallery img:nth-of-type(1)').then(function () {
                        console.log('A: first image is visible');
                    }).click('#gallery img:nth-of-type(1)').then(function () {
                        console.log('A: clicked first image in galery');
                    }).waitForVisible('#image img').then(function () {
                        console.log('A: #image img is visible');
                    }).scroll(0, 10000).then(function () {
                        console.log('A: scrolled down to the end');
                    }).getAttribute('#image img', 'src').then(function (src) {
                        imageUrlA = src;
                        console.log('A: image src ' + src);
                    }).getUrl().then(function (url) {

                        var allButA = Object.keys(self.deviceOptions).filter(function (deviceName) {
                            return deviceName != 'A';
                        });
                        var i = 0;
                        return multiAction(self.devices, allButA, function (device) {
                            return device.waitForVisible('#image img', 3000);
                        }).then(function () {
                            console.log('B: image found');
                            return multiAction(self.devices, allButA, function (device) {
                                return device.getAttribute('#image img', 'src');
                            });
                        }).then(function (srcs) {
                            Object.keys(srcs).forEach(function (key) {
                                var src = srcs[key];
                                console.log('A: imageUrlA ' + imageUrlA);
                                console.log('B: image src ' + src);
                                assert.equal(src, imageUrlA);
                            });

                            return multiAction(self.devices, allButA, function (device) {
                                return device.saveScreenshot('./screenshots/device' + i + '.png', function (err, screenshot, response) {
                                    console.log(i + ': save screenshot');
                                    console.log('err: ' + err);
                                    i++;
                                });
                            });
                        });
                    }).saveScreenshot('./screenshots/deviceA.png', function (err, screenshot, response) {
                        console.log('A: save screenshot');
                        console.log('err: ' + err);
                    });
                });
            });
        });
    });
});
