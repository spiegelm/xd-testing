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

    it('should respect promise chain', function() {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        let queue = '0'
        let deviceIds
        return xdTesting.multiremote(options)
            .then(() => queue += '1')
            .getDeviceIds().then(ret => {
                deviceIds = ret.value
                var defer = q.defer()
                defer.resolve()
                return defer.promise.delay(1000).then(() => queue += '2')
            })
            .then(() => queue += '3')
            .selectById(() => deviceIds, devices => devices
                .then(() => queue += '4')
            )
            .then(() => assert.equal(queue, '01234'))
    })
})
