"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');

describe('MultiDevice - selectBySize', function () {
    var test = this;

    test.devices = {};
    test.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        return test.devices.endAll();
    });

    it('should act on the specified devices', function () {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .then(() => test.devices.selectBySize(['small'])
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
            );
    });

    it('should not act on other devices', function () {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .then(() => test.devices.selectBySize(['small'])
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
            ).then(() => test.devices.select('C')
                .getText('#counter').then(textC => assert.equal(textC, '-'))
            );
    });

    it('should be callable on the monad chain', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        test.devices = xdTesting.multiremote(options)
            .init();

        return test.devices
            .url(test.baseUrl)
            //.selectBySize(['small'])
            .then(() => {
                return "smallDevicesStub";
            }).then((stub) => {
                assert.equal(stub, "smallDevicesStub");
            }).selectBySize(['small'])
            .then((value) => {
                var smallDevices = value.selectedDevices;
                return smallDevices.getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
            });
    });

    it('should be callable on the monad chain -- debug', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        test.devices = xdTesting.multiremote(options)
            .init();

        return test.devices
            .url(test.baseUrl)
            //.selectBySize(['small'])
            .then(() => {
                return "smallDevicesStub";
            }).then((stub) => {
                assert.equal(stub, "smallDevicesStub");
            }).then(() => {
                /*!
                 * Simulate context
                 */
                var size = ['small'];
                var multiDevice = {
                    options: options,
                    instances: {
                        A: test.devices.select('A'),
                        B: test.devices.select('B'),
                        C: test.devices.select('C')
                    }
                };
                var MultiDevice = require('../../lib/multidevice');

                /*!
                 * Original function
                 */

                var matchingInstanceIds = Object.keys(multiDevice.options).filter(id => size.indexOf(multiDevice.options[id].size) >= 0);

                // TODO Refactor this: Merge with multiremote() ?

                // TODO use only corresponding option items
                var newOptions = multiDevice.options;
                var newMultiDevice = new MultiDevice(newOptions);
                matchingInstanceIds.forEach(id => {
                    newMultiDevice.addInstance(id, multiDevice.instances[id]);
                });
                var remote = xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);
                return {x: remote};
            }).then((value) => {
                var smallDevices = value.x;
                return smallDevices.getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
            });
    });
});
