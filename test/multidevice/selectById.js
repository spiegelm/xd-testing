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
            .selectById(['B', 'C'], selectedDevices => selectedDevices
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
            .selectById(['B', 'C'], selectedDevices => selectedDevices
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
            ).then(() => test.devices.select('A')
                .getText('#counter').then(textA => assert.equal(textA, '-'))
            );
    });

    it('should execute promises callback', function() {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()};

        var queue = '';
        return test.devices = xdTesting.multiremote(options)
            .then(() => queue += '0')
            .selectById(['B', 'C'], selectedDevices => {
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
            .selectById(['B', 'C'], selectedDevices => selectedDevices
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

    it('should retain the command history', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };

        return test.devices = xdTesting.multiremote(options)
            .init() // 1 command
            .url(test.baseUrl) // 1 command
            .click('#button') // 3 commands total
            .selectById(['A', 'B'], selectedDevices => selectedDevices
                .click('#button') // 3 commands total
                .getText('#counter') // 3 commands total
            )
            .then(() => {
                return q.all([
                    test.devices.select('A').getCommandHistory().then(h => {
                        assert.equal(h.length, 11);
                        assert.deepEqual(h.map(element => element.name),
                            ['init', 'url', 'click', 'element', 'elementIdClick', 'click',
                                'element', 'elementIdClick', 'getText', 'elements', 'elementIdText']
                        );
                    }),
                    test.devices.select('B').getCommandHistory().then(h => {
                        assert.equal(h.length, 11);
                        assert.deepEqual(h.map(element => element.name),
                            ['init', 'url', 'click', 'element', 'elementIdClick', 'click',
                                'element', 'elementIdClick', 'getText', 'elements', 'elementIdText']
                        );
                    }),
                    test.devices.select('C').getCommandHistory().then(h => {
                        assert.equal(h.length, 5);
                        assert.deepEqual(h.map(element => element.name),
                            ['init', 'url', 'click', 'element', 'elementIdClick']
                        );
                    })
                ]);
            })
            .end();
    });


});
