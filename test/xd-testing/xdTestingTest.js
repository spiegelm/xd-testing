"use strict"

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var Flow = require('../../lib/flow/flow')

describe('xdTesting @large', function() {

    let baseUrl = 'http://localhost:8090/'

    describe('command arguments', function () {
        it('are part of a step\'s command name', function () {
            let scenario = {A: templates.devices.chrome()}
            return xdTesting.multiremote(scenario).init()
                .url(baseUrl)
                .click('#button')
                .checkpoint('check')
                .getFlow().then(flow => {
                    let steps = flow.steps()
                    let stepCommandNames = steps.map(step => step.commands)
                        .filter(commands => commands.length > 0)
                    assert.lengthOf(stepCommandNames, 3)
                })
                .end()
        })
    })

    describe('#getFlow', function () {
        it('returns the flow object', function () {
            let scenario = {A: templates.devices.chrome()}
            return xdTesting.multiremote(scenario).init()
                .url(baseUrl)
                .click('#button')
                .checkpoint('end')
                .getFlow().then(flow => {
                    assert.instanceOf(flow, Flow)
                    assert.property(flow, 'devices')
                    assert.deepPropertyVal(flow, 'devices.A.deviceId', 'A')
                })
                .end()

        })
    })


    describe('app framework integration', () => {

        describe('for XD-MVC', () => {
            //// Set base url
            xdTesting.baseUrl = 'http://localhost/'

            // Define a custom adapter
            xdTesting.app = xdTesting.adapter.xdmvc

            it('should load xdTesting.baseUrl after init', () => {
                let options = {
                    A: templates.devices.chrome()
                }

                // Enable app specific commands
                xdTesting.app = xdTesting.adapter.xdmvc()

                return xdTesting.multiremote(options).init()
                    .getUrl().then(url => assert.equal(url, xdTesting.baseUrl))

                    /**
                     * App property?
                     */

                    //// Pair devices via url
                    //.app.pairDevicesViaUrl()
                    // Get event counter
                    //.app.getEventCounter().then(counter => assert.equal(counter.XDconnection == 1))
                // Wait for the next event of a type
                //.app.waitForEvent('XDconnection')
                //// Wait until the event type counter equals a value
                //.app.waitForEventCount('XDconnection', 2)
                //// Custom command
                //.app.addCommand('pairDevicesViaGUI', function() {
                //    return this.click(...)
                //})
            })
        })

    })
})
