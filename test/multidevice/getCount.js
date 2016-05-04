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
        if (test.devices && test.devices.endAll) {
            return test.devices.endAll();
        }
    });

    it('should count a single device @medium', function () {
        var options = {A: templates.devices.chrome()};
        return test.devices = xdTesting.multiremote(options)
            .getCount().then((count) => {
                assert.equal(count, 1);
                assert.equal(Object.keys(arguments).length, 0)
            });
    });

    it('should count two devices @medium', function () {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()};
        return test.devices = xdTesting.multiremote(options)
            .getCount().then((count) => {
                assert.equal(count, 2);
                assert.equal(Object.keys(arguments).length, 0)
            });
    });

    it('should count several devices @medium', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome(),
            C: templates.devices.chrome(),
            D: templates.devices.chrome()
        };
        return test.devices = xdTesting.multiremote(options)
            .getCount().then((count) => {
                assert.equal(count, 4);
                assert.equal(Object.keys(arguments).length, 0)
            });
    });

    it('should support method chaining @large', function () {
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

    it('should support selectById @large', function() {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        return test.devices = xdTesting.multiremote(options).init()
            .getCount().then(count => {
                assert.equal(count, 2)
            })
            .selectById('A', device => device
                .getCount(count => {
                    assert.equal(count, 1)
                })
            )
            .end()
    })
});