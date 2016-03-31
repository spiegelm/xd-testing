"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');
var q = require('q');

describe('MultiDevice - forEach @medium', function () {
    var test = this;

    test.devices = {};
    test.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        if (typeof test.devices['endAll'] == 'function') {
            return test.devices.endAll();
        }
    });

    it('should call function on each device', function() {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()}
        var counter = 0;
        var calledIds = [];
        return test.devices = xdTesting.multiremote(options)
            .getCount().then(count => assert.equal(count, 2, 'getCount does not match'))
            .forEach(function (device) {
                counter++;
                calledIds.push(device.options.id);
            })
            .then(function () {
                assert.equal(counter, 2, 'has not been called twice');
                assert.deepEqual(calledIds.sort(), ['A', 'B'], 'has not been called for each device');
            });
    });

    it('should call function with index parameter', function() {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()}
        var indices = [];
        return test.devices = xdTesting.multiremote(options)
            .forEach(function (device, index) {
                indices.push(index);
            })
            .then(function () {
                assert.deepEqual(indices.sort(), [0, 1], 'callback has not been called with each index');
            });
    });

    it('should respect promise chain', function() {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()}
        var queue = '';
        return test.devices = xdTesting.multiremote(options)
            .then(() => queue += '0' )
            .forEach(function (device, index) {
                var defer = q.defer();
                defer.resolve();
                return defer.promise.delay(1000).then(() => queue += '1');
            })
            .then(() => queue += '2')
            .then(() => {
                assert.equal(queue, '0112');
            });
    });

    it('should wrap callback in promise', function() {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()}
        var queue = '';
        return test.devices = xdTesting.multiremote(options)
            .then(() => queue += '0' )
            .forEach(function (device, index) {
                queue += '1';
            })
            .then(() => queue += '2')
            .then(() => {
                assert.equal(queue, '0112');
            });
    });

    it('should return a promise', function(done) {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()}
        var counter = 0;
        var defer = q.defer();
        test.devices = xdTesting.multiremote(options)
            .getCount().then(count => assert.equal(count, 2, 'getCount does not match'))
            .forEach(function (device) {
                setTimeout(function () {
                    counter++;
                    defer.resolve();
                }, 1000)
                return defer.promise;
            })
            .then(function () {
                assert.equal(counter, 2, 'has not been called twice');
                done();
            });
    });
});
