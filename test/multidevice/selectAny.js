"use strict"

var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - selectAny', function () {
    it('should select a single device @medium', function () {
        var scenario = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        return xdTesting.multiremote(scenario)
            .getCount().then(count => assert.equal(count, 2))
            .selectAny(device => device
                .getCount().then(count => assert.equal(count, 1))
            )
    })

    it('should execute promises callback @medium', function () {
        var scenario = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        var queue = ''
        return xdTesting.multiremote(scenario)
            .then(() => queue += '0')
            .selectAny(device => {
                queue += '1'
                return device.then(() => {
                    queue += '2'
                })
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
    })

    describe('on empty device sets', function() {

        it('should throw an error on command execution', function() {
            var scenario = {
            }

            var queue = ''
            return xdTesting.multiremote(scenario)
                .then(() => queue += '0')
                .selectAny(device => device
                    .click('#button')
                )
                .then(result => {
                    throw new Error('Promise was unexpectedly fulfilled. Result: ' + result)
                }, err => {
                    assert.instanceOf(err, Error)
                    assert.match(err.message, /not defined/)
                })
        })
    })

    describe('on empty device selection', function() {

        /**
         * This throws the error as expected, but we cannot grab it. Skip the test until we found a solution.
         */
        it.skip('should throw an error on command execution', function() {
            var scenario = {
                A: templates.devices.chrome()
            }

            var queue = ''
            return xdTesting.multiremote(scenario)
                .then(() => queue += '0')
                .selectByType('phone', phones => phones
                    // Select any of none
                    .selectAny(device => device
                        .click('#button')
                    )
                    .then(result => {
                        throw new Error('Promise was unexpectedly fulfilled. Result: ' + result)
                    }, err => {
                        assert.instanceOf(err, Error)
                        assert.match(err.message, /not defined/)
                    })
                )
        })
    })
})
