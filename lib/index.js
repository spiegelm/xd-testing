"use strict";

var WebdriverIO = require('webdriverio/lib/webdriverio')
var MultiDevice = require('./multidevice')
var Flow = require('./flow/flow')
var Device = require('./flow/device')
var Checkpoint = require('./flow/checkpoint')
var Step = require('./flow/step')
var templates = require('./templates')
var path = require('path')
var fs = require('fs')

/**
 * @param options
 * @param modifier
 * @param {Flow|null} flow Required for and only for instances of a multi device, but not for the multi device collection itself.
 * @returns {WebdriverIO.Client}
 */
function remote(options, modifier, flow) {

    options = options || {};

    let flowDevice = new Device(options)
    if (flow) {
        flow.addDevices([flowDevice])
    }

    let screenshotBlackList = {
        protocolQueries: ['element', 'elementActive', 'elementIdAttribute', 'elementIdCssProperty', 'elementIdDisplayed', 'elementIdElement', 'elementIdElements', 'elementIdEnabled', 'elementIdLocation', 'elementIdLocationInView', 'elementIdName', 'elementIdSelected', 'elementIdSize', 'elementIdText', 'elements', 'title', 'windowHandle', 'windowHandles'],
        stateQueries: ['isEnabled', 'isExisting', 'isSelected', 'isVisible', 'isVisibleWithinViewport'],
        cookieCommands: ['deleteCookie', 'getCookie', 'setCookie', 'cookie'],
        elementPropertyQueries: ['getAttribute', 'getCssProperty', 'getElementSize', 'getHTML', 'getLocation', 'getLocationInView', 'getSource', 'getTagName', 'getText', 'getTitle', 'getUrl', 'getValue'],
        interferingCommands: ['init', 'session', 'sessions', 'saveScreenshot', 'screenshot'],
        otherCommandsWithoutSideEffects: ['checkpoint', 'timeouts', 'timeoutsAsyncScript', 'timeoutsImplicitWait', 'windowHandlePosition', 'getCommandHistory', 'getTabIds', 'getViewportSize'],
        internalWebElementCommands: ['elementIdAttribute', 'elementIdClear', 'elementIdClick', 'elementIdCssProperty', 'elementIdDisplayed', 'elementIdElement', 'elementIdElements', 'elementIdEnabled', 'elementIdLocation', 'elementIdLocationInView', 'elementIdName', 'elementIdSelected', 'elementIdSize', 'elementIdText', 'elementIdValue'],
        xdTesting: ['windowHandleSize']
    };
    // Merge all blacklists into one list
    screenshotBlackList = Object.keys(screenshotBlackList).map(key => screenshotBlackList[key]).reduce((previous, current) => previous.concat(current), [])


    /**
     * Initialise monad
     */
    var unit = WebdriverIO(options, modifier)

    /**
     * Define flow related commands that require access to the flow.
     */
    unit.lift('checkpoint', function (checkpointName) {
        return this.saveScreenshot(function (err, screenshot, response) {
            if (err) {
                // Log screenshot error encoded as command step
                console.log('could not create screenshot', err)
                flowDevice.addStep(new Step(flow.generateStepId(), '[ERROR: could not create screenshot]', null))
            } else {
                // Create new step with screenshot
                flowDevice.addStep(new Step(flow.generateStepId(), [], screenshot))
            }

            // Create new checkpoint
            flowDevice.addCheckpoint(new Checkpoint(flow.generateCheckpointId(), checkpointName))
        })
    })

    unit.lift('name', function (name) {
        // For some reasons this.then(...) is not working, but the screenshot is.
        // Except for the overhead there should be no drawback of using the screenshot callback.
        return this.saveScreenshot(function () {
            flow.setName(name)
        })
    })

    unit.lift('getFlow', function () {
        // For some reasons this.then(...) is not working, but the screenshot is.
        // Except for the overhead there should be no drawback of using the screenshot callback.
        return this.saveScreenshot(function () {
            return flow
        })
    })

    /**
     * Add the commands and wrap them with the flow recording and screenshot generation service.
     */
    ;[
        '../node_modules/webdriverio/lib/protocol',
        '../node_modules/webdriverio/lib/commands',
        'commands'
    ].forEach(function (dir) {
        dir = path.join(__dirname, dir)
        var files = fs.readdirSync(dir)

        files.forEach(function (filename) {
            let commandName = filename.slice(0, -3)
            let commandFunc = require(path.join(dir, filename))

            /**
             * Command proxy: Take a screenshot between commands.
             * Proxy is executed for each command.
             * @returns {WebdriverIO.Client}
             */
            let proxyCommandFunc = function () {
                // Default: no additional behaviour
                let intermediate = this

                // Skip commands on the black list
                if (screenshotBlackList.indexOf(commandName) === -1) {

                    let commandArgs = arguments

                    // Take a screenshot before each command
                    // This does not override the original commands return value
                    intermediate = intermediate.saveScreenshot(function (err, screenshot, response) {
                        if (err) {
                            // Log screenshot error encoded as command step
                            console.log('could not create screenshot', err)
                            flowDevice.addStep(new Step(flow.generateStepId(), '[ERROR: could not create screenshot]', null))
                        } else {
                            // Create new step with screenshot
                            flowDevice.addStep(new Step(flow.generateStepId(), [], screenshot))
                        }
                    })

                    // Automatically insert a checkpoint before the browser session is closed
                    if (commandName === 'end' || commandName === 'endAll') {
                        // Skip checkpoint if it already exists
                        if (flowDevice.checkpoints.filter(checkpoint => checkpoint.name === commandName).length === 0) {
                            intermediate = intermediate.checkpoint(commandName)
                        }
                    }

                    // Add command in a separate step after the screenshot
                    intermediate = intermediate.then(function() {
                        let commandLabel = commandName
                        if (typeof commandArgs[0] == "string") {
                            commandLabel += "('" + commandArgs[0] + "')"
                        }
                        flowDevice.addStep(new Step(flow.generateStepId(), commandLabel, null))

                        // Serialize and store the steps and screenshots
                        flow.storeIfChanged()
                    })
                }

                // Execute the original command after the intermediate flow recording
                return commandFunc.apply(intermediate, arguments);
            }

            // Register the wrapped command
            unit.lift(commandName, proxyCommandFunc);
        })
    })

    // Instantiate the webdriverIO client
    var prototype = unit()
    prototype.defer.resolve()

    return prototype
}

module.exports.remote = remote

/**
 * @param scenario
 * @returns {WebdriverIO.Client}
 */
function multiremote(scenario) {

    // Add id key to scenario
    Object.keys(scenario).forEach(function (id) {
        scenario[id]['id'] = id
        scenario[id]['waitforTimeout'] = scenario[id]['waitforTimeout'] || waitForTimeout
    })

    // Instantiate MultiDevice and Flow
    var multiDevice = new MultiDevice(scenario)
    var flow = new Flow()

    // Generate webdriverIO client for each device defined in the scenario and add the instances to the MultiDevice
    Object.keys(scenario).forEach(function (browserName) {
        multiDevice.addInstance(
            browserName,
            remote(scenario[browserName], multiDevice.getInstanceModifier(), flow)
        )
    })

    // Generate a compound webdriverIO client abstracting the internal clients
    return remote(scenario, multiDevice.getModifier(null, flow), null)
}

module.exports.multiremote = multiremote

/**
 * Load scenarios from the config file.
 * Replace device string references by the full device template.
 * @returns {Array.<Object.<String, Object>>}
 */
function loadScenarios() {
    var config = require(path.join(process.cwd(), scenariosFile))

    // Resolve templates: Replace device string references by the full options
    config['scenarios'].forEach(setup => {
        Object.keys(setup.devices).forEach(id => {
            var deviceConfig = setup.devices[id]
            if (typeof deviceConfig == "string" && templates.devices[deviceConfig]) {
                // Replace template reference
                setup.devices[id] = templates.devices[deviceConfig]()
            }
        })
    })
    return config['scenarios']
}
module.exports.scenariosFile = scenariosFile

/**
 * Defined scenario file used by `loadScenarios`.
 * @type {string}
 */
const scenariosFile = 'xd-testing.json'
module.exports.loadScenarios = loadScenarios

/**
 * The template interface.
 * Use `devices` to access all devices or a template property value for specific devices, e.g. `large.nexus10`.
 */
module.exports.templates = templates

/**
 * Config
 */

/**
 * Time until a waitFor* command is aborted.
 * @type {number}
 */
var waitForTimeout = 60 * 1000
module.exports.waitForTimeout = waitForTimeout

/**
 * URL to load on initialization of multiremote and remote clients.
 * Set to null to skip URL initialization.
 * @type {string|null}
 */
module.exports.baseUrl = null

/**
 * Set of provided application framework adapters.
 */
module.exports.adapter = {
    /**
     * @return {xdmvc}
     */
    xdmvc: require('./adapter/xdmvc')
}

/**
 * Used application framework adapter.
 * Needs to be a function that accepts the multiremote client as argument.
 * @return {Function|Function.<xdmvc>}
 */
module.exports.appFramework = null

/**
 * Reset properties to default.
 * e.g. appFramework, baseUrl, scenariosFile, waitForTimeout
 */
module.exports.reset = () => {
    module.exports.appFramework = null
    module.exports.baseUrl = null
    module.exports.scenariosFile = scenariosFile
    module.exports.waitForTimeout = waitForTimeout
}

module.exports.reset()
