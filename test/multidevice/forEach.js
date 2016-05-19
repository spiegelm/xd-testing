"use strict"

var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - forEach @medium', function () {
    it('should call the callback on each device', function() {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        var counter = 0
        var calledIds = []
        return xdTesting.multiremote(options)
            .getCount().then(count => assert.equal(count, 2, 'getCount does not match'))
            .forEach(function (device) {
                counter++
                calledIds.push(device.options.id)
            })
            .then(function () {
                assert.equal(counter, 2, 'has not been called twice')
                assert.deepEqual(calledIds.sort(), ['A', 'B'], 'has not been called for each device')
            })
    })

    it('should call the callback with index parameter', function() {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        var indices = []
        return xdTesting.multiremote(options)
            .forEach(function (device, index) {
                indices.push(index)
            })
            .then(function () {
                assert.deepEqual(indices.sort(), [0, 1], 'callback has not been called with each index')
            })
    })

    it('should respect promise chain', function() {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        var queue = '0'
        return xdTesting.multiremote(options)
            .then(() => queue += '1' )
            .forEach(function (device, index) {
                var defer = q.defer()
                defer.resolve()
                return defer.promise.delay(1000).then(() => queue += '2')
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '01223'))
    })

    it('should wrap callback in promise', function() {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        var queue = '0'
        return xdTesting.multiremote(options)
            .then(() => queue += '1' )
            .forEach((device, index) => {
                queue += '2'
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '01223'))
    })
})
