"use strict";

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = xdTesting.templates
/**
 * @type {Q}
 */
var q = require('q')


describe('XD-MVC Gallery @large', function () {
    var test = this

    // Set test timeout
    test.timeout(180 * 1000)
    test.baseUrl = "http://localhost:8082/gallery.html"

    beforeEach(() => {
        xdTesting.reset()
        xdTesting.appFramework = xdTesting.adapter.xdmvc
    })

    afterEach(xdTesting.reset)

    describe('eventLogger', () => {
        it('should increase XDconnection event count after pairing', () => {
            let options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            let loadedUrlA
            return xdTesting.multiremote(options).init()
                .url(test.baseUrl)
                .app().getEventCounter()
                .then(counterA => assert.equal(counterA['XDconnection'], 0))
                // Share url from A to B
                .getUrl().then(urlA => loadedUrlA = urlA)
                .selectById('B', B => B
                    .url(loadedUrlA)
                )
                // Assert connection event
                .selectById('A', A => A
                    .app().waitForEventCount('XDconnection', 1)
                )
                .end()
        })
    })

    it('should pair two devices via url', () => {
        let options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        return xdTesting.multiremote(options).init()
            .app().pairDevicesViaURL(test.baseUrl)
            .app().getConnectedDeviceCount()
            .then((countA, countB) => {
                assert.equal(countA, 2)
                assert.equal(countA, 2)
            })
            .end()
    });

    describe('should show the selected image on the other devices', () => {

        xdTesting.loadSetups().forEach(setup => {

            // Assemble setup name
            let options = setup.devices
            let setupName = Object.keys(options).map(key => options[key].name).join(', ')

            it('on ' + setupName, function () {
                let imageUrlA

                return xdTesting.multiremote(options).init()
                    .app().pairDevicesViaURL(test.baseUrl)
                    .name(setupName)
                    .checkpoint('load app')
                    .selectById('A',
                        deviceA => deviceA
                            .waitForVisible('h2.gallery-overview')
                            .click('//*[text()="Bike Tours"]')
                            .waitForVisible('#gallery img:nth-of-type(1)')
                            .checkpoint('select album')
                            .click('#gallery img:nth-of-type(1)')
                            .waitForVisible('#image img')
                            .scroll('#image img')
                            .checkpoint('click thumbnail')
                            .getAttribute('#image img', 'src')
                            .then(src => imageUrlA = src),
                        otherDevices => otherDevices
                            .waitForVisible('#image img')
                            .checkpoint('click thumbnail')
                            .getAttribute('#image img', 'src')
                            .then(function () {
                                let srcs = arguments
                                Object.keys(srcs).forEach(key => {
                                    var src = srcs[key]
                                    assert.equal(src, imageUrlA)
                                })
                            })
                    )
                    .checkpoint('end')
                    .end()
            })
        })
    })
})
