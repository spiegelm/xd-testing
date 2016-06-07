"use strict"

var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - selectAny', function () {
    it('should select a single device @medium', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .getCount().then(count => assert.equal(count, 2))
            .selectAny(device => device
                .getCount().then(count => assert.equal(count, 1))
            )
    })

    it('should execute promises callback @medium', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        var queue = ''
        return xdTesting.multiremote(options)
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

})
