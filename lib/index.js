"use strict";

var WebdriverIO = require('webdriverio/lib/webdriverio');
var MultiDevice = require('./multidevice');
var AddressOptions = require('./addressOptions');
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
 * @param {AddressOptions} [addressingOptions]
 * @returns {WebdriverIO.Client}
 * @todo Remove the unused multiDevice paramter?
 */
function remote(options, modifier, multiDevice, flow, addressingOptions) {

    console.log("New remote with addressingOptions: " + addressingOptions)

    options = options || {};
    addressingOptions = addressingOptions || new AddressOptions()

    let flowDevice = new Device(options)
    if (flow) {
        flow.addDevices([flowDevice])
    }

    let screenshotBlackList = {
        protocolQueries: ['element', 'elementActive', 'elementIdAttribute', 'elementIdCssProperty', 'elementIdDisplayed', 'elementIdElement', 'elementIdElements', 'elementIdEnabled', 'elementIdLocation', 'elementIdLocationInView', 'elementIdName', 'elementIdSelected', 'elementIdSize', 'elementIdText', 'elements', 'title', 'windowHandle', 'windowHandles'],
        stateQueries: ['isEnabled', 'isExisting', 'isSelected', 'isVisible', 'isVisibleWithinViewport'],
        cookieCommands: ['deleteCookie', 'getCookie', 'setCookie', 'cookie'],
        elementPropertyQueries: ['getAttribute', 'getCssProperty', 'getElementSize', 'getHTML', 'getLocation', 'getLocationInView', 'getSource', 'getTagName', 'getText', 'getTitle', 'getUrl', 'getValue'],
        interferingCommands: ['init', 'end', 'endAll', 'session', 'sessions', 'saveScreenshot', 'screenshot'],
        otherCommandsWithoutSideEffects: ['checkpoint', 'timeouts', 'timeoutsAsyncScript', 'timeoutsImplicitWait', 'windowHandlePosition', 'getCommandHistory', 'getTabIds', 'getViewportSize'],
        internalWebElementCommands: ['elementIdAttribute', 'elementIdClear', 'elementIdClick', 'elementIdCssProperty', 'elementIdDisplayed', 'elementIdElement', 'elementIdElements', 'elementIdEnabled', 'elementIdLocation', 'elementIdLocationInView', 'elementIdName', 'elementIdSelected', 'elementIdSize', 'elementIdText', 'elementIdValue']
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
            flowDevice.addStep(new Step(flow.generateStepId(), [], screenshot))

            // Create new checkpoint
            flowDevice.addCheckpoint(new Checkpoint(flow.generateCheckpointId(), checkpointName))
        })
    })

    unit.lift('name', function(name) {
        // For some reasons this.then(...) is not working, but the screenshot is.
        // Except for the overhead there should be no drawback
        return this.saveScreenshot(function() {
            flow.setName(name)
        })
    })

    unit.lift('getFlow', function() {
        // For some reasons this.then(...) is not working, but the screenshot is.
        // Except for the overhead there should be no drawback
        return this.saveScreenshot(function() {
            return flow
        })
    })

    unit.lift('getAddressingOptions', function() {
        return this.saveScreenshot(function() {
            return addressingOptions
        })
    })

    unit.lift('setImplicitDeviceSelection', function(implicit) {
        if (typeof(implicit) !== 'boolean') {
            throw new Error('Invalid parameter. Expected boolean, got ' + implicit)
        }
        return this.saveScreenshot(function() {
            addressingOptions.implicit = implicit
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

            //console.log(20, "addressingOptions", addressingOptions)

            /**
             * Command proxy: Take a screenshot between commands
             * @returns {WebdriverIO.Client}
             */
            let proxyCommandFunc = function () {
                // Default: no additional behaviour
                let intermediate = device => device;

                //console.log(30, "addressingOptions", addressingOptions, newObject)

                if (commandName === 'end' || commandName === 'endAll') {
                    // Serialize and store the steps and screenshots only at the end.
                    // Storing flows with large screenshots can take a while.
                    flow.storeIfChanged()

                } else if (screenshotBlackList.indexOf(commandName) === -1) {

                    let commandLabel = commandName
                    if (typeof arguments[0] == "string" ) {
                        commandLabel += "('" + arguments[0] + "')"
                    }
                    flowDevice.addStep(new Step(flow.generateStepId(), commandLabel, null))

                    // Take a screenshot before each command
                    // This does not override the original commands return value
                    // TODO think about taking screenshots on all devices to capture side effects
                    intermediate = device => device.saveScreenshot(function (err, screenshot, response) {
                        if (err) {
                            console.log(err);
                            throw new err;
                        }
                        flowDevice.addStep(new Step(flow.generateStepId(), [], screenshot));
                    });
                }

                // Implicit device selection
                let implicitDeviceSelection = addressingOptions.implicit && commandName == "click"

                //console.log(commandName, arguments, addressingOptions, "implicitDeviceSelection", implicitDeviceSelection)

                if (implicitDeviceSelection) {
                    console.log("using implicit device selection")
                    let selector = arguments[0]
                    return this.selectByElement(selector, device => {
                        console.log("Execute " + commandName + " " + selector + ", on device:", device.options)
                        return commandFunc.apply(intermediate(device), arguments)
                    })
                } else {
                    // Explicit device selection
                    // Execute function after the intermediate
                    return commandFunc.apply(intermediate(this), arguments);
                }
            }

            unit.lift(commandName, proxyCommandFunc);
        });
    });

    var prototype = unit();
    prototype.defer.resolve();

    return prototype.setImplicitDeviceSelection(addressingOptions.implicit);
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
