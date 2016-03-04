"use strict";

var xdTesting = require('../index');
var MultiDevice = require('../multidevice');

module.exports = (multiDevice) => {

    // Embed selectBySize in monad chain
    // TODO give selectDevices directly as argument instead of encapsulate it.
    var example = function() {
        devices.selectBySize(['small'])
            .then((value) => {
                var smallDevices = value.selectedDevices;
                return smallDevices.getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '-')))
                    .click('#button')
                    .getText('#counter').then((text1, text2) => [text1, text2].forEach(text => assert.equal(text, '1')))
            });
    }

    return function selectBySize(size) {
        if (!size instanceof Array) {
            size = [size]
        }

        var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => size.indexOf(multiDevice.options[id].size) >= 0);

        // TODO Refactor this: Merge with multiremote() ?

        // TODO use only corresponding option items
        var newOptions = multiDevice.options;
        var newMultiDevice = new MultiDevice(newOptions);

        matchingInstanceIds.forEach(id => {
            newMultiDevice.addInstance(id, multiDevice.instances[id]);
        })
        var remote = xdTesting.remote(multiDevice.options, newMultiDevice.getModifier(), newMultiDevice);
        // We cannot return the remote object directly, because it's a promise.
        // WebdriverIO overrides the client.then() function to resolve promises and does not respect their return value.
        return {selectedDevices: remote};
    }
}
