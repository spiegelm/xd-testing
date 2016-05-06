"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');
var q = require('q');

describe('MultiDevice - selectByElement', function () {
    var test = this;

    test.baseUrl = "http://localhost:8090/";

    it('should select devices that contain the element @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .isVisible('#button')
            .then((visibleA, visibleB) => {
                assert.isTrue(visibleA)
                assert.isTrue(visibleB)
            })
            .selectByElement('#button', devices => devices
                .getCount()
                .then(count => assert.equal(count, 2))
            )
            .end()
    })

    it('should not select devices that don\'t contain the element @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        return xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .isVisible('#none')
            .then((visibleA, visibleB) => {
                assert.isFalse(visibleA)
                assert.isFalse(visibleB)
            })
            .selectByElement('#none', devices => devices
                .getCount()
                .then(count => assert.equal(count, 0))
            )
            .end()
    })

    it('should execute promises callback @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        var queue = '';
        return xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .then(() => queue += '0')
            .selectByElement('#button', selectedDevices => {
                queue += '1';
                return selectedDevices.then(() => {
                    queue += '2';
                });
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
            .end()
    });

    describe.skip('todo', function () {

        it('should adapt options to selection @medium', function () {
            var options = {
                A: templates.devices.nexus10(),
                B: templates.devices.nexus4(),
                C: templates.devices.nexus4()
            };

            return test.devices = xdTesting.multiremote(options)
                .selectBySize('small', selectedDevices => selectedDevices
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

        it('should handle empty selections @medium', function () {
            var options = {
                A: templates.devices.nexus10(),
                B: templates.devices.nexus4(),
                C: templates.devices.nexus4()
            };

            let queue = '';
            return test.devices = xdTesting.multiremote(options)
                .selectBySize('medium', selectedDevices => selectedDevices
                    .then(() => queue += '0')
                    .forEach((device, index) => queue += device.options.id)
                    .then(() => queue += '1')
                ).then(() => {
                    assert.equal(queue, '01');
                });
        });
    })

});
