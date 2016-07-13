"use strict"

var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')

describe('debug', function() {
    it('endAll - close all browser windows @large', () => {
        let scenario = {A: templates.devices.chrome()}
        return xdTesting.multiremote(scenario)
            .endAll()
    })
})
