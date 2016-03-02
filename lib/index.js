"use strict";

var WebdriverIO = require('webdriverio/lib/webdriverio');
var MultiDevice = require('./multidevice');
var path = require('path'),
    fs = require('fs');


var remote = module.exports.remote = function remote(options, modifier, multiDevice) {

    options = options || {};

    /**
     * Initialise monad
     */
    var unit = WebdriverIO(options, modifier);

    /**
     * Add the webdriverIO commands
     * Build prototype: commands
     */
    ['protocol', 'commands'].forEach(function(commandType) {
        var dir = path.join(__dirname, '../node_modules/webdriverio', 'lib', commandType),
            files = fs.readdirSync(dir);

        files.forEach(function(filename) {
            var commandName = filename.slice(0, -3);
            unit.lift(commandName, require(path.join(dir, filename)));
        });
    });

    /**
     * Add xdTesting commands
     */
    ['commands'].forEach(function (commandType) {
        var dir = path.join(__dirname, commandType),
            files = fs.readdirSync(dir);

        files.forEach(function (filename) {
            var commandName = filename.slice(0, -3); // remove .js suffix
            unit.lift(commandName, require(path.join(dir, filename))(multiDevice));
        });
    });

    var prototype = unit();
    prototype.defer.resolve();
    return prototype;
};

/**
 * @todo Lookup WebdriverIO jsdoc
 */
module.exports.multiremote = function multiremote(options) {
    var multiDevice = new MultiDevice(options);

    Object.keys(options).forEach(function(browserName) {
        multiDevice.addInstance(
            browserName,
            remote(options[browserName], multiDevice.getInstanceModifier(), multiDevice)
        );
    });

    var multiModifier = multiDevice.getModifier();
    return remote(options, multiModifier, multiDevice);
};
