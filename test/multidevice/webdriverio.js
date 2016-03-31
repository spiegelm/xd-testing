"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');

describe.skip('MultiDevice - WebdriverIO commands', function () {
    var test = this;

    test.devices = {};
    test.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        return test.devices.endAll();
    });

    it('should be supported on multiple devices @large', function () {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome()};
        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '-')))
            .click('#button')
            .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '1')))
            .end();
    });

    it.skip('should be supported on a single device @large', function () {
        var options = {A: templates.devices.chrome()};
        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '-')))
            .click('#button')
            .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '1')))
            .end();
    });
});
