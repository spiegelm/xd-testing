"use strict";

var WebdriverIO = require('webdriverio/lib/webdriverio');
var MultiDevice = require('./multidevice');
var Flow = require('./flow/flow')
var Device = require('./flow/device')
var Checkpoint = require('./flow/checkpoint')
var Step = require('./flow/step')
var path = require('path')
var fs = require('fs')

/**
 * @param options
 * @param modifier
 * @param {MultiDevice} multiDevice
 * @param {Flow|null} flow Required for and only for instances of a multi device, but not for the multi device collection itself.
 * @returns {WebdriverIO.Client}
 */
function remote(options, modifier, multiDevice, flow) {

    options = options || {};

    let flowName = null

    let device = new Device(options)
    if (flow) {
        flow.addDevices([device])
    }

    let screenshotBlackList = {
        protocolQueries: ['element', 'elementActive', 'elementIdAttribute', 'elementIdCssProperty', 'elementIdDisplayed', 'elementIdElement', 'elementIdElements', 'elementIdEnabled', 'elementIdLocation', 'elementIdLocationInView', 'elementIdName', 'elementIdSelected', 'elementIdSize', 'elementIdText', 'elements', 'title', 'windowHandle', 'windowHandles'],
        stateQueries: ['isEnabled', 'isExisting', 'isSelected', 'isVisible', 'isVisibleWithinViewport'],
        cookieCommands: ['deleteCookie', 'getCookie', 'setCookie', 'cookie'],
        elementPropertyQueries: ['getAttribute', 'getCssProperty', 'getElementSize', 'getHTML', 'getLocation', 'getLocationInView', 'getSource', 'getTagName', 'getText', 'getTitle', 'getUrl', 'getValue'],
        interferingCommands: ['init', 'end', 'endAll', 'session', 'sessions', 'saveScreenshot', 'screenshot'],
        otherCommandsWithoutSideEffects: ['checkpoint', 'timeouts', 'timeoutsAsyncScript', 'timeoutsImplicitWait', 'windowHandlePosition', 'getCommandHistory', 'getTabIds', 'getViewportSize'],
    };
    // Merge all blacklists into one list
    screenshotBlackList = Object.keys(screenshotBlackList).map(key => screenshotBlackList[key]).reduce((previous, current) => previous.concat(current), [])


    /**
     * Initialise monad
     */
    var unit = WebdriverIO(options, modifier)

    unit.lift('checkpoint', function(checkpointName) {
        return this.saveScreenshot(function (err, screenshot, response) {
            // Create new step with screenshot
            device.addStep(new Step(flow.generateStepId(), [], screenshot))

            // Create new checkpoint
            device.addCheckpoint(new Checkpoint(flow.generateCheckpointId(), checkpointName))
        })
    })

    unit.lift('name', function(name) {
        // For some reasons this.then(...) is not working, but this is.
        return this.saveScreenshot(function() {
            flowName = name
        })
    })

    /**
     * Add the webdriverIO commands
     * Build prototype: commands
     */
    ;['protocol', 'commands'].forEach(function(commandType) {
        var dir = path.join(__dirname, '../node_modules/webdriverio', 'lib', commandType)
        var files = fs.readdirSync(dir)

        files.forEach(function(filename) {
            let commandName = filename.slice(0, -3)
            let commandFunc = require(path.join(dir, filename))

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
                    // Remove anything non-alphanumeric chars from filename
                    let fileName = flowName === null ? '' : ('_' + flowName.replace(/[^a-z0-9]/gi, '_').toLowerCase())
                    fileName = 'flow' + fileName + '.json'
                    flow.storeIfChanged(fileName)

                } else if (screenshotBlackList.indexOf(commandName) === -1) {
                    //let deviceId = this.options.id;

                    let commandLabel = commandName
                    if (typeof arguments[0] == "string" ) {
                        commandLabel += "('" + arguments[0] + "')"
                    }
                    device.addStep(new Step(flow.generateStepId(), commandLabel, null))

                    // Take a screenshot before each command
                    // This does not override the original commands return value
                    // TODO think about taking screenshots on all devices to capture side effects
                    intermediate = this.saveScreenshot(function (err, screenshot, response) {
                        if (err) {
                            console.log(err);
                            throw new err;
                        }
                        device.addStep(new Step(flow.generateStepId(), [], screenshot));
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
}

module.exports.remote = remote;

/**
 * @param options
 * @returns {WebdriverIO.Client}
 */
function multiremote(options) {

    // Add id key to options
    Object.keys(options).forEach(function (id) {
        options[id]['id'] = id;
    });

    var multiDevice = new MultiDevice(options);
    var flow = new Flow();

    Object.keys(options).forEach(function(browserName) {
        multiDevice.addInstance(
            browserName,
            remote(options[browserName], multiDevice.getInstanceModifier(), multiDevice, flow)
        );
    });

    var multiModifier = multiDevice.getModifier();
    return remote(options, multiModifier, multiDevice, null);
}

module.exports.multiremote = multiremote;
