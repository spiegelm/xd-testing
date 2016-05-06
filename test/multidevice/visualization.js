"use strict";

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');
var q = require('q');

describe('MultiDevice - visualization', function () {
    var test = this;

    test.baseUrl = "http://localhost:8090/";

    it('script @large', function () {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()};

        return xdTesting.multiremote(options)
            .init()
            .windowHandleSize({width: 200, height: 200})
            .url(test.baseUrl)
            .checkpoint('loaded')
            .checkpoint('loaded#2')
            .selectById(['B', 'C'], selectedDevices => selectedDevices
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .checkpoint('click')
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
            )
            .checkpoint('end')
            .end();
    });

});
