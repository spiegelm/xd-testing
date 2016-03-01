"use strict";

var assert = require('chai').assert;
var utility = require('../../../lib/utility')
var xdTesting = require('../../../lib/index')
var templates = require('../../../lib/templates');
var q = require('q');

describe('forEach', function () {
    var self = this;

    // Set test timeout
    this.timeout(5 * 1000);
    utility.waitforTimeout = 5 * 1000;

    self.devices = {};
    self.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        return self.devices.endAll();
    });


    it('should call function on each device', function(done) {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()}
        var counter = 0;
        self.devices = xdTesting.multiremote(options)
            .init()
            .getCount().then(count => assert.equal(count, 2, 'getCount does not match'))
            .forEach(function (device) {
                counter++;
            })
            .then(function () {
                assert.equal(counter, 2, 'has not been called twice');
                done();
            })
        ;
    });

    it('should return a promise', function(done) {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()}
        var counter = 0;
        var defer = q.defer();
        self.devices = xdTesting.multiremote(options)
            .init()
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
            })
        ;
    });
});
