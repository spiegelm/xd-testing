"use strict"

var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - implicit', function () {
    let test = this

    test.baseUrl = "http://localhost:8090/"
    const buttonSelector = '#button'

    let urlWithButton = withButton => test.baseUrl + "?hideButton=" + (withButton ? 0 : 1)

    describe('prerequisites', () => {
        it('urlWithButton returns correct urls @small', () => {
            assert.equal(urlWithButton(false), "http://localhost:8090/?hideButton=1")
            assert.equal(urlWithButton(true), "http://localhost:8090/?hideButton=0")
        })

        it('testapp shows button per default @large', () => {
            var options = {
                A: templates.devices.chrome()
            }

            return xdTesting.multiremote(options).init()
                .url(test.baseUrl)
                .isVisible(buttonSelector).then(visible => assert.isTrue(visible))
                .end()
        })

        it('testapp /?hideButton=1 hides button @large', () => {
            var options = {
                A: templates.devices.chrome()
            }

            return xdTesting.multiremote(options).init()
                .url(urlWithButton(false))
                .isVisible(buttonSelector).then(visible => assert.isFalse(visible))
                .end()
        })
    })

    it('should set implicit device selection @large', function () {
        var options = {
            A: templates.devices.chrome()
        }

        return xdTesting.multiremote(options).init()
            .forEach((device, index) => device.url(urlWithButton(index === 0)))
            .getAddressingOptions()
            .then(addr => console.log(addr))
            .implicit(devices => devices
                .getAddressingOptions()
                .then(addr => assert.equal(addr.implicit, true))
            )
            .end()
    })

    it.skip('should select all matching devices for each element related command @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        return xdTesting.multiremote(options).init()
            .forEach((device, index) => device.url(urlWithButton(index === 0)))
            .getAddressingOptions()
            .then(addr => console.log(addr))
            .implicit(devices => devices
                .getAddressingOptions()
                .then(addr => console.log(addr))
                .click('#button')
            )
            //.forEach(device => device
            //    .getText('#counter').then(text => assert.equal(text, '1'))
            //)
            .end()
    })

    it.skip('should execute promises callback @medium', function () {
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
            .end()
    })

})
