"use strict";

var assert = require('chai').assert;
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates');

describe('MultiDevice', function () {
    var self = this;

    self.devices = {};
    self.baseUrl = "http://localhost:8090/";

    afterEach(function () {
        // Close browsers before completing a test
        return self.devices.endAll();
    });

    describe('WebdriverIO commands', function () {
        it('should be supported on multiple devices', function () {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '1')))
                ;
        });

        it.skip('should be supported on a single device', function () {
            var options = {A: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textA, textB) => [textA, textB].forEach(text => assert.equal(text, '1')))
                ;
        });
    })

    describe('selectById', function () {
        it('should act on the specified devices', function () {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .then(() => self.devices.selectById(['B', 'C'])
                    .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
                )
                ;
        });

        it('should not act on other devices', function () {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .then(() => self.devices.selectById(['B', 'C'])
                    .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
                ).then(() => self.devices.select('A')
                    .getText('#counter').then(textA => assert.equal(textA, '-'))
                )
                ;
        });
    });

    describe('selectBySize', function () {
        it ('should act on the specified devices', function () {
            var options = {A: templates.devices.nexus4(), B: templates.devices.nexus4(), C: templates.devices.nexus10()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .then(() => self.devices.selectBySize(['small'])
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
                )
                ;
        });

        it ('should not act on other devices', function () {
            var options = {A: templates.devices.nexus4(), B: templates.devices.nexus4(), C: templates.devices.nexus10()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .then(() => self.devices.selectBySize(['small'])
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
                ).then(() => self.devices.select('C')
                    .getText('#counter').then(textC => assert.equal(textC, '-'))
                )
                ;
        });
    });

    describe('getCount', function () {
        it('should count a single device', function () {
            var options = {A: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .getCount().then((count) => {
                    assert.equal(count, 1);
                    assert.equal(Object.keys(arguments).length, 0)
                });
        });

        it('should count two devices', function () {
            var options = {A: templates.devices.chrome(), B: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .getCount().then((count) => {
                    assert.equal(count, 2);
                    assert.equal(Object.keys(arguments).length, 0)
                });
        });

        it('should count several devices', function () {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome(),
                C: templates.devices.chrome(),
                D: templates.devices.chrome()
            };
            return self.devices = xdTesting.multiremote(options)
                .init()
                .getCount().then((count) => {
                    assert.equal(count, 4);
                    assert.equal(Object.keys(arguments).length, 0)
                });
        });

        it('should support method chaining', function () {
            var options = {A: templates.devices.chrome()};
            return self.devices = xdTesting.multiremote(options)
                .init()
                .url(self.baseUrl)
                .getCount().then((count) => {
                    assert.equal(count, 1);
                    assert.equal(Object.keys(arguments).length, 0)
                }).getCount().then((count) => {
                    assert.equal(count, 1);
                    assert.equal(Object.keys(arguments).length, 0)
                }).getUrl().then(url => {
                    assert.equal(url, self.baseUrl);
                });
        });
    });
});