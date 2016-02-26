"use strict";

var webdriverio = require('webdriverio');
var MultiDevice = require('./multidevice');

module.exports.remote = webdriverio.remote;

module.exports.multiremote = function multiremote(options) {
    var multiDevice = new MultiDevice();

    Object.keys(options).forEach(function(browserName) {
        multiDevice.addInstance(
            browserName,
            webdriverio.remote(options[browserName], multiDevice.getInstanceModifier())
        );
    });

    var multiModifier = multiDevice.getModifier();
    multiDevice.options = options;
    return webdriverio.remote(options, multiModifier);
};
