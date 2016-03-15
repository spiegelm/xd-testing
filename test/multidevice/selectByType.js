"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');

describe('MultiDevice - selectByType', function () {
    var test = this;

    test.devices = {};
    test.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        return test.devices.endAll();
    });

    it('should only act on the specified devices', function () {
        var options = {A: templates.devices.nexus10(), B: templates.devices.nexus4(), C: templates.devices.nexus4()};

        let queue = [];
        return test.devices = xdTesting.multiremote(options)
            .selectByType('phone', selectedDevices => selectedDevices
                .forEach((device, index) => queue.push(device.options.id))
            ).then(() => {
                assert.deepEqual(queue.sort(), ['B', 'C'])
            });
    });

    it('should execute promises callback', function() {
        var options = {A: templates.devices.nexus10(), B: templates.devices.nexus4(), C: templates.devices.nexus4()};

        var queue = '';
        return test.devices = xdTesting.multiremote(options)
            .then(() => queue += '0')
            .selectByType('phone', selectedDevices => {
                queue += '1';
                return selectedDevices.then(() => {
                    queue += '2';
                });
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
            .end();
    });

    it('should adapt options to selection', function() {
        var options = {
            A: templates.devices.nexus10(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus4()
        };

        return test.devices = xdTesting.multiremote(options)
            .selectByType('phone', selectedDevices => selectedDevices
                .then(() => {
                    assert.property(selectedDevices, 'options');
                    assert.notProperty(selectedDevices.options, 'A');
                    assert.property(selectedDevices.options, 'B');
                    assert.property(selectedDevices.options, 'C');
                    assert.deepEqual(selectedDevices.options.B, options.B)
                    assert.deepEqual(selectedDevices.options.C, options.C)
                })
            );
    });
});
