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
        if (test.devices && test.devices.endAll) {
            return test.devices.endAll();
        }
    });

    //after(function () {
    //    // Close browsers before completing a test
    //    return xdTesting.multiremote({}).endAll();
    //});


    it('should act on the specified devices', function () {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .selectBySize('small', selectedDevices => selectedDevices
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
            .selectBySize(['small'], selectedDevices => selectedDevices
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
            ).then(() => test.devices.select('C')
                .getText('#counter').then(textC => assert.equal(textC, '-'))
            );
    });

    it('should execute promises callback', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };

        var queue = '';
        return test.devices = xdTesting.multiremote(options)
            .then(() => queue += '0')
            .selectBySize('small', function(selectedDevices) {
                queue += '1';
                return selectedDevices.then(() => {
                    queue += '2';
                });
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
            .end();
    });

    it.skip('should be callable on the monad chain and return a client', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        test.devices = xdTesting.multiremote(options)
            .init();

        return test.devices
            .selectBySize(['small'])
            .then(smallDevices => {
                assert.isNotNull(smallDevices);
                assert.hasProperty(smallDevices, 'click');
                assert.hasProperty(smallDevices, 'url');
                assert.hasProperty(smallDevices, 'then');
            });
    });

    it.skip('should be callable on the monad chain and return a `selectedDevices` property', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        test.devices = xdTesting.multiremote(options)
            .init();

        return test.devices
            .url(test.baseUrl)
            .then(() => test.devices.selectBySize(['small']).selectedDevices
                .then((value) => {
                    var smallDevices = value.selectedDevices;
                    return smallDevices.getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                        .click('#button')
                        .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
                })
            );
    });

    it('debug -- promises', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        test.devices = xdTesting.multiremote(options)
            .init();

        return test.devices
            .url(test.baseUrl)
            .then(() => {
                return "smallDevicesStub";
            }).then((stub) => {
                assert.equal(stub, "smallDevicesStub");
            }).then(() => {
                var remote = "remote";
                // Note: We cannot use `then` because it will no be propagated as a value, but as a promise
                return {
                    andThen: function (callback) {
                        callback(remote);
                    }
                };
            }).then((value) => {
                assert.isNotNull(value);
                var x = function(remote) {
                    assert.equal(remote, "remote");
                };
                return value.andThen(x);
            });
    });

    it('debug -- monad chain: return `andThen` property', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        test.devices = xdTesting.multiremote(options)
            .init();

        return test.devices
            .url(test.baseUrl)
            .then(() => {
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
                var newRemote = xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);


                var then = function myThen(callback) {
                    return callback(newRemote);
                }
                // Note: We cannot use `then` because it will no be propagated as a value, but as a promise
                return {andThen: then};
            }).then((remote) => {
                assert.isNotNull(remote);
                assert.isDefined(remote);

                remote.andThen(smallDevices => smallDevices.getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
                );
            });
    });

    it.skip('debug -- monad chain: return promise returning client', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        };
        test.devices = xdTesting.multiremote(options)
            .init();

        return test.devices
            .url(test.baseUrl)
            .then(() => {
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
                var newClient = xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);

                var q = require('q');
                var defer = q.defer();
                defer.resolve(newClient);
                return defer.promise;
            }).then((newClient) => {
                assert.isNotNull(newClient);
                assert.isDefined(newClient);

                return newClient.getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')));
            });
    });
});
