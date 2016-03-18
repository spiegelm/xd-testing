"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');

describe('MultiDevice - getCount', function () {
    var test = this;

    test.devices = {};
    test.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        return test.devices.endAll();
    });

    it('should count a single device', function () {
        var options = {A: templates.devices.chrome()};
        return test.devices = xdTesting.multiremote(options)
            .init()
            .getCount().then((count) => {
                assert.equal(count, 1);
                assert.equal(Object.keys(arguments).length, 0)
            });
    });

    it('should count two devices', function () {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()};
        return test.devices = xdTesting.multiremote(options)
            .init()
            .getCount().then((count) => {
                assert.equal(count, 2);
                assert.equal(Object.keys(arguments).length, 0)
            });
    });

    it('should count several devices', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome(),
            C: templates.devices.chrome(),
            D: templates.devices.chrome()
        };
        return test.devices = xdTesting.multiremote(options)
            .init()
            .getCount().then((count) => {
                assert.equal(count, 4);
                assert.equal(Object.keys(arguments).length, 0)
            });
    });

    it('should support method chaining', function () {
        var options = {A: templates.devices.chrome()};
        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .getCount().then((count) => {
                assert.equal(count, 1);
                assert.equal(Object.keys(arguments).length, 0)
            }).getCount().then((count) => {
                assert.equal(count, 1);
                assert.equal(Object.keys(arguments).length, 0)
            }).getUrl().then(url => {
                assert.equal(url, test.baseUrl);
            });
    });
});