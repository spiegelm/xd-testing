"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');
var q = require('q');

describe('MultiDevice - selectBySize', function () {
    var test = this;

    test.devices = {};
    test.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        if (test.devices && test.devices.endAll) {
            return test.devices.endAll();
        }
    });

    it('should only act on the specified devices @large', function () {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        }
        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .selectBySize(['small'], selectedDevices => selectedDevices
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
            ).then(() => test.devices.select('C')
                .getText('#counter').then(textC => assert.equal(textC, '-'))
            )
    })

    it('should execute promises callback @medium', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        }

        let queue = ''
        return test.devices = xdTesting.multiremote(options)
            .then(() => queue += '0')
            .selectBySize('small', function(selectedDevices) {
                queue += '1'
                return selectedDevices.then(() => {
                    queue += '2'
                })
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
            .end()
    });

    it('should adapt options to selection @medium', function() {
        var options = {
            A: templates.devices.nexus10(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus4()
        }

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
            )
            .end()
    });

    it('should handle empty selections @medium', function() {
        var options = {A: templates.devices.nexus10(), B: templates.devices.nexus4(), C: templates.devices.nexus4()}

        let queue = ''
        return test.devices = xdTesting.multiremote(options)
            .selectBySize('medium', selectedDevices => selectedDevices
                .then(() => queue += '0')
                .forEach((device, index) => queue += device.options.id)
                .then(() => queue += '1')
            ).then(() => {
                assert.equal(queue, '01');
            })
    });
});
