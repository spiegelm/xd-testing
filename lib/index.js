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
    var step = 0;

    /**
     * Add the webdriverIO commands
     * Build prototype: commands
     */
    ['protocol', 'commands'].forEach(function(commandType) {
        var dir = path.join(__dirname, '../node_modules/webdriverio', 'lib', commandType),
            files = fs.readdirSync(dir);

        files.forEach(function(filename) {
            var commandName = filename.slice(0, -3);
            unit.lift(commandName,
                ['saveScreenshot', 'screenshot'].indexOf(commandName) > -1
                    ? require(path.join(dir, filename))
                    : function () {
                        // Command proxy: Create a screenshot after each command

                        // Inject screenshot command
                        let localStep = step;
                        let localCommandName = commandName;
                        step += 1;
                        console.log(localStep, localCommandName);

                        // TODO properly align within the promise chain
                        this.saveScreenshot('./screenshots/step' + localStep + '_' + localCommandName + '.png')

                        // Execute function
                        let commandFunc = require(path.join(dir, filename));
                        let result = commandFunc.apply(this, arguments);

                        return result;

                        //.then((function (arg0, arg1, arg2, arg3, arg4, arg5) {
                        //    console.log(arguments, arg0, arg1, arg2, arg3, arg4, arg5);
                        //    return this.saveScreenshot('./screenshots/step' + localStep + '_' + localCommandName + '.png')
                        //        .then(() => arguments);
                        //}).bind(this));
                    }
            );
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
    // Add id key to options
    Object.keys(options).forEach(function (id) {
        options[id]['id'] = id;
    });

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
