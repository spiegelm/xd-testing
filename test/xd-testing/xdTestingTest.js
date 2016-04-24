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

    describe('command arguments', function() {
        it('are part of a step\'s command name', function() {
            let scenario = {A: templates.devices.chrome()}
            return xdTesting.multiremote(scenario).init()
                .url(baseUrl)
                .click('#button')
                .getFlow().then(flow => {
                    console.log(flow.steps())
                    assert.typeOf(flow.steps, 'function')
                    assert.lengthOf(flow.steps(), 2)
                    assert.equal(flow.steps()[0], {})
                })
                .end()
        })
    })

    describe('#getFlow', function() {
        it('returns the flow object', function() {
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
})
