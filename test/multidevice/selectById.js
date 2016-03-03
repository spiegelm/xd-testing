"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');

describe('MultiDevice - selectById', function () {
    var test = this;

    test.devices = {};
    test.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        return test.devices.endAll();
    });

    it('should act on the specified devices', function () {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()};

        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .then(() => test.devices.selectById(['B', 'C'])
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
            );
    });

    it('should not act on other devices', function () {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()};

        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .then(() => test.devices.selectById(['B', 'C'])
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
            ).then(() => test.devices.select('A')
                .getText('#counter').then(textA => assert.equal(textA, '-'))
            );
    });
});
