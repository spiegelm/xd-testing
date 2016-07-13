"use strict"

/**
 * @type {Chai.Assert} assert
 */
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
                return q.delay(1000).then(() => queue += '2')
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '01223'))
    })

    describe('should return callback values as objects', () => {
        it('when using a callback function, allow access to arguments object', () => {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options)
                .forEach(device => device.options.id)
                .then(function(val1, val2) {
                    assert.deepEqual(Object.keys(arguments), ['0', '1'])
                    assert.deepEqual(Object.keys(arguments).map(key => arguments[key]), ['A', 'B'])
                    // No idea why this doesn't work:
                    //assert.deepEqual(arguments, {'0': 'A', '1': 'B'})
                    assert.equal(val1, 'A')
                    assert.equal(val2, 'B')
                })
        })

        it('when using a arrow function, address', () => {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options)
                .forEach(device => device.options.id)
                .then((val1, val2) => {
                    assert.equal(val1, 'A')
                    assert.equal(val2, 'B')
                })
        })
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

    it('should ignore callbacks on empty device sets', function() {
        var options = {
        }

        let runCallback = false
        return xdTesting.multiremote(options)
            .forEach(device => {
                runCallback = true
                throw new Error('Does should never be executed')
            })
            .then(() => q.delay(100))
            .then(() => {
                assert.isFalse(runCallback)
            })
    })
})
