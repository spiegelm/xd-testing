"use strict";

// Node.js tests
if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
}

var webdriverio = require('webdriverio');
var q = require('q');
//q.longStackSupport = true;


var assert = buster.referee.assert;
var expect = buster.referee.expect;
var refute = buster.referee.refute;

//buster.spec.expose(); // Make BDD functions global


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

var setupConnectedBrowsers = function() {
    var setup = q.defer();

    var self = this;
    var deviceA = self.devices.select('A');

    return deviceA.url(self.baseUrl).then(function () {
        console.log('A: init');
    }).execute(function () {
        return 1 + 2;
    }).then(function(ret) {

        console.log('A: executed script');
        console.log(ret.value);
        expect(ret.value).toBe(3);
    }).execute(injectEventLogger).then(function() {
        console.log('A: injected event logger');
    }).getUrl().then(function(url) {
        //return self.deviceB.url(url).then(function () {

        var allButA = Object.keys(self.deviceOptions).filter(function(deviceName) {
            return deviceName != 'A';
        });
        return multiAction(self.devices, allButA, function(device) {
            return device.url(url);
        }).then(function() {
            console.log('init urls');

            return deviceA.waitUntil(function() {
                return deviceA.execute(getEventCounter).then(function(ret) {
                    console.log('A: got eventCounter: ');
                    console.log(ret.value);
                    console.log('devices.length: ' + self.devicesCount());
                    return ret.value.XDconnection == self.devicesCount() - 1;
                    //return ret.value.XDconnection == devicesButA.count();
                });
            });
        });

        //var devicesButA = self.devices.select('B');
        ////var devicesButA = self.devices.but('A');
        //return devicesButA.url(url).then(function () {
        //    console.log('but A: init');
        //
        //    return deviceA.waitUntil(function() {
        //        return deviceA.execute(getEventCounter).then(function(ret) {
        //            console.log('A: got eventCounter: ');
        //            console.log(ret.value);
        //            return ret.value.XDconnection > 0;
        //            //return ret.value.XDconnection == devicesButA.count();
        //        });
        //    });
        //});
    })

};

var devicesCount = function() {
    var self = this;
    return Object.keys(self.deviceOptions).length;
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


//var specs = describe("XD-Test-gallery", function() {
buster.testCase("XD-MVC Example Gallery", {

    //before(function() {
    setUp: function () {
        this.baseUrl = "http://me.local:8082/gallery.html";

        // Bind function to this reference
        this.setupConnectedBrowsers = setupConnectedBrowsers.bind(this);
        this.devicesCount = devicesCount.bind(this);

        // Set timeout
        this.timeout = 1000 * 30; // 30s

        // New browser instance with WebdriverIO


        this.deviceOptions = {
            A: {
                desiredCapabilities: {browserName: 'chrome'}
            },
            B: {
                desiredCapabilities: {browserName: 'chrome'}
            },
            C: {
                desiredCapabilities: {browserName: 'chrome'}
            }
        };
        this.devices = webdriverio.multiremote(this.deviceOptions);
        //attachCustomFunctions(this.devices);

        var self = this;
        var tileWidth = Math.floor(1600 / this.devicesCount());

        return this.devices.init()
            .windowHandleSize({width: tileWidth , height: 600})
            .then(function() {
                // Align windows on screen
                var x = 0;
                Object.keys(self.deviceOptions).forEach(function(deviceName) {
                    self.devices.select(deviceName).windowHandlePosition({x: x, y: 0});
                    x += tileWidth;
                });

                // legacy variables
                self.deviceA = self.devices.select('A');
                self.deviceB = self.devices.select('B');
            });
    },

    //after(function () {
    tearDown: function () {
        // Close browser before completing a test
        return this.devices.end();
        //this.deviceB.end();
    },

    // it('eventLogger', function() {
    'eventLogger': {
        'should count XDconnection events': function() {
            var self = this;

            return self.setupConnectedBrowsers().then(function() {
                return self.deviceA.execute(getEventCounter).then(function(ret) {
                    console.log('A: got eventCounter: ');
                    console.log(ret.value);
                    expect(ret.value.XDconnection).toBe(self.devicesCount() - 1);
                });
            });
        }
    },

    //it('should not share cookies across browser sessions', function (done) {
    'should not share cookies across browser sessions': function () {
        var self = this;

        return self.deviceA.url(this.baseUrl).then(function () {
            return self.deviceB.url(self.baseUrl);
        }).setCookie({name: 'test_cookieA', value: 'A'})
        .getCookie('test_cookieA').then(function (cookie) {

            refute.isNull(cookie);
            assert.equals(cookie.name, 'test_cookieA');
            assert.equals(cookie.value, 'A');

            return self.deviceB.setCookie({name: 'test_cookieB', value: 'B'})
            .getCookie('test_cookieB').then(function (cookie) {

                refute.isNull(cookie);
                assert.equals(cookie.name, 'test_cookieB');
                assert.equals(cookie.value, 'B');

            }).getCookie('test_cookieA').then(function (cookie) {
                assert.isNull(cookie);
            });
        });
    },
//});

//it('should not share local storage across browser sessions', function (done) {
    'should not share local storage across browser sessions': function () {
        var self = this;

        var getItem = function(key) {
            console.log('localStorage.getItem ' + key);
            return localStorage.getItem(key);
        };

        var setItem = function(key, value) {
            localStorage.setItem(key, value);
        };

        return self.deviceA.url(self.baseUrl).then(function () {
            return self.deviceB.url(self.baseUrl);
        }).execute(setItem, 'test_storageA', 'A')
        .execute(getItem, 'test_storageA').then(function (ret) {
            assert.equals(ret.value, 'A');

            return self.deviceB.execute(getItem, 'test_storageA').then(function (ret) {
                assert.isNull(ret.value);
            });
        });
    //});
    },

    'should show the selected image on the other devices': function () {
    //it('should show the selected image on the second device', function () {

        var self = this;

        var imageUrlA;

        return this.setupConnectedBrowsers().then(function () {
            console.log('setup two connected browsers');
        }).waitForVisible('h2.gallery-overview').then(function () {
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

            var allButA = Object.keys(self.deviceOptions).filter(function(deviceName) {
                return deviceName != 'A';
            });
            var i = 0;
            return multiAction(self.devices, allButA, function(device) {
                return device.waitForVisible('#image img', 3000);
            }).then(function() {
                console.log('B: image found');
                return multiAction(self.devices, allButA, function(device) {
                    return device.getAttribute('#image img', 'src');
                });
            }).then(function (srcs) {
                Object.keys(srcs).forEach(function(key) {
                    var src = srcs[key];
                    console.log('A: imageUrlA ' + imageUrlA);
                    console.log('B: image src ' + src);
                    assert.equals(src, imageUrlA);
                });

                return multiAction(self.devices, allButA, function(device) {
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
        }).endAll();
    //});
    }
});
