"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');
var q = require('q');

describe('MultiDevice - selectBySize', function () {
    var test = this;

    test.devices = {};
    test.baseUrl = "http://localhost:8090/";

    test.fixture = {
        basic_app: {
            url: test.baseUrl,
            buttonSelector: '#button',
            counterSelector: '#counter'
        }
    }


    it('should only act on the specified devices @large', function () {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        }
        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .selectBySize(['xsmall'], selectedDevices => selectedDevices
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
            ).then(() => test.devices.select('C')
                .getText('#counter').then(textC => assert.equal(textC, '-'))
            )
    })

    it('should execute promises callback @medium', function() {
        var options = {
            A: templates.devices.nexus4()
        }

        let queue = ''
        return test.devices = xdTesting.multiremote(options)
            .then(() => queue += '0')
            .selectBySize('xsmall', function(selectedDevices) {
                queue += '1'
                return selectedDevices.then(() => {
                    queue += '2'
                })
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
    });

    it('should adapt options to selection @medium', function() {
        var options = {
            A: templates.devices.nexus10(),
            xsmall1: templates.devices.nexus4(),
            xsmall2: templates.devices.nexus4()
        }

        return test.devices = xdTesting.multiremote(options)
            .selectBySize('xsmall', selectedDevices => selectedDevices
                .then(() => {
                    assert.property(selectedDevices, 'options');
                    assert.notProperty(selectedDevices.options, 'A');
                    assert.property(selectedDevices.options, 'xsmall1');
                    assert.property(selectedDevices.options, 'xsmall2');
                    assert.deepEqual(selectedDevices.options.xsmall1, options.xsmall1)
                    assert.deepEqual(selectedDevices.options.xsmall2, options.xsmall2)
                })
            )
    });

    describe('empty selections', function() {
        it('should execute promise chain @medium', function() {
            var options = {
                A: templates.devices.nexus10()
            }

            let queue = ''
            return test.devices = xdTesting.multiremote(options)
                .selectBySize('xsmall', selectedDevices => selectedDevices
                    .then(() => queue += '0')
                    .forEach((device, index) => queue += device.options.id)
                    .then(() => queue += '1')
                ).then(() => {
                    assert.equal(queue, '01');
                })
        });

        it('should ignore commands on empty selections @large', function() {
            var options = {
                A: templates.devices.nexus10()
            }

            let queue = ''
            return test.devices = xdTesting.multiremote(options).init()
                .url(test.fixture.basic_app.url)
                .selectBySize('xsmall', selectedDevices => selectedDevices
                    .then(() => queue += '0')
                    // Perform click on no devices
                    .click('#inexistantId')
                    .then(() => queue += '1')
                )
                .then(() => {
                    assert.equal(queue, '01');
                })
                .end()
        });
    })
});
