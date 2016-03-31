"use strict";

var WebdriverIO = require('webdriverio/lib/webdriverio');
var MultiDevice = require('./multidevice');
var Flow = require('./flow'),
    Step = require('./step');
var path = require('path'),
    fs = require('fs');

var step = 0;

var flow = new Flow();

var remote = module.exports.remote = function remote(options, modifier, multiDevice) {

    options = options || {};

    let screenshotBlackList = {
        protocolQueries: ['element', 'elementActive', 'elementIdAttribute', 'elementIdCssProperty', 'elementIdDisplayed', 'elementIdElement', 'elementIdElements', 'elementIdEnabled', 'elementIdLocation', 'elementIdLocationInView', 'elementIdName', 'elementIdSelected', 'elementIdSize', 'elementIdText', 'elements', 'title', 'windowHandle', 'windowHandles'],
        stateQueries: ['isEnabled', 'isExisting', 'isSelected', 'isVisible', 'isVisibleWithinViewport'],
        cookieCommands: ['deleteCookie', 'getCookie', 'setCookie', 'cookie'],
        elementPropertyQueries: ['getAttribute', 'getCssProperty', 'getElementSize', 'getHTML', 'getLocation', 'getLocationInView', 'getSource', 'getTagName', 'getText', 'getTitle', 'getUrl', 'getValue'],
        interferingCommands: ['init', 'end', 'endAll', 'session', 'sessions', 'saveScreenshot', 'screenshot'],
        otherCommandsWithoutSideEffects: ['timeouts', 'timeoutsAsyncScript', 'timeoutsImplicitWait', 'windowHandlePosition', 'getCommandHistory', 'getTabIds', 'getViewportSize']
    };
    // Merge all blacklists into one list
    screenshotBlackList = Object.keys(screenshotBlackList).map(key => screenshotBlackList[key]).reduce((previous, current) => previous.concat(current), []);


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

            /**
             * Command proxy: Take a screenshot between commands
             * @returns {WebdriverIO.Client}
             */
            let proxyCommandFunc = function () {
                // Default: no additional behaviour
                let intermediate = this;

                if (commandName === 'end' || commandName == 'endAll') {
                    // Serialize and store the steps and screenshots only at the end.
                    // Storing flows with large screenshots can take a while.
                    // TODO only rewrite file of cache is dirty
                    flow.store()
                } else if (screenshotBlackList.indexOf(commandName) === -1) {
                    let globalStep = step;
                    let deviceId = this.options.id;
                    step += 1;

                    //console.log(globalStep, deviceId, commandName);

                    // Take a screenshot before each command
                    // This does not override the original commands return value
                    // TODO ensure last command is finished, use waitUntil?
                    // TODO think about taking screenshots on all devices to capture side effects
                    intermediate = this.saveScreenshot(function (err, screenshot, response) {
                        if (err) {
                            console.log(err);
                            throw new err;
                        }
                        var step = new Step(deviceId, globalStep, commandName, screenshot, this.options);

                        flow.addStep(step)
                    });
                }

                // Execute function after the intermediate
                return commandFunc.apply(intermediate, arguments);
            }

            unit.lift(commandName, proxyCommandFunc);
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
