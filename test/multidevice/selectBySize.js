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
});
