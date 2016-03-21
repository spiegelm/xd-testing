"use strict";

var WebdriverIO = require('webdriverio/lib/webdriverio');
var MultiDevice = require('./multidevice');
var StepStorage = require('./stepStorage'),
    Step = require('./step');
var path = require('path'),
    fs = require('fs');

var step = 0;

var stepStorage = new StepStorage();

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
            let commandName = filename.slice(0, -3);
            let commandFunc = require(path.join(dir, filename));
            let proxyCommandFunc = function () {
                // Command proxy: Take a screenshot between commands

                let globalStep = step;
                let localCommandName = commandName;
                let localId = this.options.id;
                step += 1;
                console.log(localId, globalStep, localCommandName);


                // Take a screenshot before each command
                // This does not override the original commands return value
                // TODO ensure last command is finished, use waitUntil?
                // TODO think about taking screenshots on all devices to capture side effects
                let intermediate = this.saveScreenshot(
                    //'./screenshots/step' + globalStep + '_' + localId + '_' + localCommandName + '.png',
                    function(err, screenshot, response) {
                        if (err) {
                            console.log(err);
                            throw new err;
                        }
                        var step = new Step(localId, globalStep, localCommandName, screenshot);

                        const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
                        var file = path.join(SCREENSHOT_DIR, 'step' + step.step + step.deviceId + '_' + step.command + '.png');
                        fs.writeFileSync(file, screenshot, 'base64');

                        step.image = file;

                        stepStorage.addStep(step).store();
                    }
                );

                // Execute function after the screenshot
                return commandFunc.apply(intermediate, arguments);
            };

            let proxyBlackList =  ['saveScreenshot', 'screenshot', 'end', 'endAll', 'session', 'sessions'];

            unit.lift(commandName,
                proxyBlackList.indexOf(commandName) !== -1 ? commandFunc : proxyCommandFunc
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
