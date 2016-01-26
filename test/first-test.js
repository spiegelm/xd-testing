"use strict";

// Node.js tests
if (typeof module == "object" && typeof require == "function") {
    var buster = require("buster");
}

var webdriverio = require('webdriverio');


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

//var specs = describe("XD-Test-gallery", function() {
buster.testCase("XD-MVC Example Gallery", {

    //before(function() {
    setUp: function () {
        this.baseUrl = "http://me.local:8082/gallery.html";

        // Set timeout
        this.timeout = 1000 * 30; // 30s

        // New browser instance with WebdriverIO
        var options = {desiredCapabilities: {browserName: 'chrome'}};
        var clientA = webdriverio.remote(options);
        var clientB = webdriverio.remote(options);

        this.browserA = clientA.init();
        this.browserA
            .windowHandleSize({width: 800, height: 600})
            .windowHandlePosition({x: 0, y: 0});
        this.browserB = clientB.init()
            .windowHandleSize({width: 800, height: 600})
            .windowHandlePosition({x: 800, y: 0});

    },

    //after(function () {
    tearDown: function () {
        // Close browser before completing a test
        this.browserA.end();
        this.browserB.end();
    },

    // it('eventLogger', function() {
    'eventLogger': {
        'should count XDconnection events': function() {
            var self = this;

            return self.browserA.url(self.baseUrl).then(function () {
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
                return self.browserB.url(url).then(function () {
                    console.log('B: init');

                    return self.browserA.waitUntil(function() {
                        return self.browserA.execute(getEventCounter).then(function(ret) {
                            console.log('A: got eventCounter: ');
                            console.log(ret.value);
                            return ret.value.XDconnection > 0;
                        });
                    }).then(function() {
                        return self.browserA.execute(getEventCounter).then(function(ret) {
                            console.log('A: got eventCounter: ');
                            console.log(ret.value);
                            expect(ret.value.XDconnection).toBe(1);

                            //self.browserA.endAll();
                        });
                    });
                });
            })
        }
    },

    //it('should not share cookies across browser sessions', function (done) {
    'should not share cookies across browser sessions': function (done) {
        var self = this;

        self.browserA.url(this.baseUrl).then(function () {
            self.browserB.url(self.baseUrl).then(function () {

                self.browserA.setCookie({name: 'test_cookieA', value: 'A'})
                    .getCookie('test_cookieA').then(function (cookie) {

                    refute.isNull(cookie);
                    assert.equals(cookie.name, 'test_cookieA');
                    assert.equals(cookie.value, 'A');

                    self.browserB.setCookie({name: 'test_cookieB', value: 'B'})
                        .getCookie('test_cookieB').then(function (cookie) {

                        refute.isNull(cookie);
                        assert.equals(cookie.name, 'test_cookieB');
                        assert.equals(cookie.value, 'B');

                    }).getCookie('test_cookieA').then(function (cookie) {
                        assert.isNull(cookie);

                        self.browserA.endAll();
                        done();
                    });
                });
            });
        });
    },
//});

//it('should not share local storage across browser sessions', function (done) {
    'should not share local storage across browser sessions': function (done) {
        var self = this;

        self.browserA.url(this.baseUrl).then(function () {
            self.browserB.url(self.baseUrl).then(function () {

                var getItem = function(key) {
                    console.log('localStorage.getItem ' + key);
                    return localStorage.getItem(key);
                };

                var setItem = function(key, value) {
                    localStorage.setItem(key, value);
                };

                self.browserA.execute(setItem, 'test_storageA', 'A').then(function(ret) {
                }).execute(getItem, 'test_storageA').then(function (ret) {
                    assert.equals(ret.value, 'A');

                    self.browserB.execute(getItem, 'test_storageA').then(function (ret) {
                        assert.isNull(ret.value);
                        self.browserA.endAll();
                        done();
                    });
                });
            });
        });
    //});
    },

    'should show the selected image on the second device': function () {
    //it('should show the selected image on the second device', function () {

        var self = this;

        var imageUrlA;

        return this.browserA.url(this.baseUrl).then(function () {
            console.log('A: initialized');
            // Wait until application is loaded

        }).getUrl().then(function (url) {
            console.log('A: url ' + url);
            self.browserB.url(url).then(function () {
                console.log('B: url ' + url);
            });
        }).waitForVisible('h2.gallery-overview').then(function () {
            console.log('A: h2.gallery-overview is visible');
        }).click('//*[text()="Bike Tours"]').then(function () {
            console.log('A: clicked Bike Tours');
        }).pause(3000).then(function () {
            console.log('A: waited for 3000ms');
        }).waitForVisible('#gallery img:nth-of-type(1)').then(function () {
            console.log('A: first image is visible');
        }).click('#gallery img:nth-of-type(1)').then(function () {
            console.log('A: clicked first image in galery');
        }).waitForVisible('#image img').then(function () {
            console.log('A: #image img is visible');
        }).scroll(0, 1000).then(function () {
            console.log('A: scrolled down to the end');
        }).getAttribute('#image img', 'src').then(function (src) {
            imageUrlA = src;
            console.log('A: image src ' + src);
        }).getUrl().then(function (url) {
            return self.browserB.waitForVisible('#image img', 3000).then(function () {
                console.log('B: image found');
            }).pause(3000).then(function () {
                console.log('B: waited for 3000ms');
            }).getAttribute('#image img', 'src').then(function (src) {
                console.log('A: imageUrlA ' + imageUrlA);
                console.log('B: image src ' + src);

                assert.equals(src, imageUrlA);

                if (src == imageUrlA) {
                    console.log('SUCCESS, images are equal!');
                } else {
                    console.log('ERROR! different images.');
                }
                self.browserA.saveScreenshot('./screenshots/browserA.png', function (err, screenshot, response) {
                    console.log('A: save screenshot');
                    console.log('err: ' + err);
                })
            }).saveScreenshot('./screenshots/browserB.png', function (err, screenshot, response) {
                console.log('B: save screenshot');
                console.log('err: ' + err);

                //// Tell test runner we're done with the async test
                //done();
            }).endAll();
        });
    //});
    }
});
