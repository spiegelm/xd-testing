"use strict"

var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - any', function () {
    let test = this

    test.baseUrl = "http://localhost:8090/"
    const buttonSelector = '#button'

    let urlWithButton = withButton => test.baseUrl + "?hideButton=" + (withButton ? 0 : 1)

    it('should not use `any` device selection per default @medium', function() {
        var options = {
            A: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .getAddressingOptions()
            .then(addr => assert.equal(addr.any, false))
            .end()
    })

    it('should set `any` device selection @medium', function () {
        var options = {
            A: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .any(devices => devices
                .getAddressingOptions()
                .then(addr => assert.equal(addr.any, true))
            )
            .end()
    })

    it.skip('should call .forEach on a single device? @medium', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        let counter = 0

        return xdTesting.multiremote(options)
            .any(devices => devices
                .forEach(device => counter++)
            )
            .then(() => assert.equal(counter, 1, "Failed asserting that callback was called exactly once."))
            .end()
    })

    it.skip('should .getCount return 1? @medium', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        let counter = 0

        return xdTesting.multiremote(options)
            .any(devices => devices
                .forEach(device => counter++)
            )
            .then(() => assert.equal(counter, 1, "Failed asserting that callback was called exactly once."))
            .end()
    })

    it.skip('should return the selection when no callback argument is given')

    it('should select a single matching device for each command with element selector @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        let clickCount = 0

        return xdTesting.multiremote(options).init()
            .url(urlWithButton(true))
            .any(devices => devices
                .click('#button')
            )
            .forEach((device, index) => device
                .getText('#counter').then(text => clickCount += +(text === '-' ? 0 : text))
            )
            .then(() => assert.equal(1, clickCount, "Failed asserting that exactly one button was clicked."))
            .end()
    })

    it('should execute callback in order @medium', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        var queue = ''
        return xdTesting.multiremote(options)
            .then(() => queue += '0')
            .any(device => {
                queue += '1'
                return device.then(() => {
                    queue += '2'
                })
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
            .end()
    })

})
