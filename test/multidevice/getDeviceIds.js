"use strict"

/**
 * @type Chai.Assert
 */
var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - getDeviceIds', () => {
    it('should return an array of ids', () => {
        let options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        return xdTesting.multiremote(options)
            .getDeviceIds().then(ret => assert.deepEqual(ret.value, ['A', 'B']))
    })
})
