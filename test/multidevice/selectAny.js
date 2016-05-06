"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');
var q = require('q');

describe('MultiDevice - selectAny', function () {
    var test = this;

    test.baseUrl = "http://localhost:8090/";

    it('should select a single device @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        };

        return xdTesting.multiremote(options)
            .selectAny(device => device
                .getCount().then(count => assert.equal(count, 1))
            )
            .end()
    });

    it('should execute promises callback @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        };

        var queue = '';
        return xdTesting.multiremote(options)
            .then(() => queue += '0')
            .selectAny(device => {
                queue += '1';
                return device.then(() => {
                    queue += '2';
                });
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
            .end();
    });

});
