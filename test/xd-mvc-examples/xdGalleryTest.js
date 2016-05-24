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
    test.adapter = require('../../lib/adapter/xdmvc')

    describe('eventLogger', () => {
        it('should count XDconnection events', () => {
            let options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            let loadedUrlA
            return xdTesting.multiremote(options).init()
                .url(test.baseUrl)
                .execute(test.adapter.injectEventLogger)
                .execute(test.adapter.getEventCounter)
                .then(function (retA) {
                    assert.equal(retA.value.XDconnection, 0)
                })
                // Share url from A to B
                .getUrl().then(urlA => loadedUrlA = urlA)
                .selectById('B', B => B
                    .url(loadedUrlA)
                    .execute(test.adapter.injectEventLogger)
                )
                // Assert connection event
                .selectById('A', A => A
                    .waitUntil(() => A
                        .execute(test.adapter.getEventCounter)
                        .then(function (retA) {
                            return retA.value.XDconnection === 1
                        })
                    )
                    .execute(test.adapter.getEventCounter)
                    .then(function (ret) {
                        assert.equal(ret.value.XDconnection, 1)
                    })
                )
                .end()
        })
    })

    it('should pair two devices via url', () => {
        let options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }
        let devices = xdTesting.multiremote(options).init()
        devices = test.adapter.pairDevicesViaURL(devices, test.baseUrl)
        return devices
            .selectById('A', deviceA => deviceA
                .execute(test.adapter.getEventCounter)
                .then(ret => assert.equal(ret.value.XDconnection, 1))
            )
            .end()
    });

    describe('prerequisites', () => {
        it('browsers should not share cookies between sessions', () => {
            let options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            let devices = xdTesting.multiremote(options).init()
            devices = test.adapter.pairDevicesViaURL(devices, test.baseUrl)
            return devices
                .selectById('A', deviceA => deviceA
                    // Set cookie and verify it's there
                    .setCookie({name: 'test_cookieA', value: 'A'})
                    .getCookie('test_cookieA')
                    .then(cookie => {
                        assert.notEqual(cookie, null)
                        assert.equal(cookie.name, 'test_cookieA')
                        assert.equal(cookie.value, 'A')
                    })
                )
                .selectById('B', deviceB => deviceB
                    // Set another cookie and verify it's there
                    .setCookie({name: 'test_cookieB', value: 'B'})
                    .getCookie('test_cookieB').then(cookie => {
                        assert.notEqual(cookie, null)
                        assert.equal(cookie.name, 'test_cookieB')
                        assert.equal(cookie.value, 'B')
                    })
                    // Verify the cookie from the other browser is not here
                    .getCookie('test_cookieA')
                    .then(cookie => {
                        assert.equal(cookie, null)
                    })
                )
                .end()
        })

        it('browsers should not share local storage between sessions', () => {
            let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

            let devices = xdTesting.multiremote(options).init()
            devices = test.adapter.pairDevicesViaURL(devices, test.baseUrl)
            return devices
                .selectById('A', deviceA => deviceA
                    // Set local storage item and verify it's there
                    .execute(() => localStorage.setItem('test_storageA', 'A'))
                    .execute(() => localStorage.getItem('test_storageA')).then(ret => assert.equal(ret.value, 'A'))
                )
                .selectById('B', deviceB => deviceB
                    // Verify the item from the other browser is not here
                    .execute(() => localStorage.getItem('test_storageA')).then(ret =>assert.equal(ret.value, null))
                )
                .end()
        })
    })

    describe('should show the selected image on the other devices', () => {

        xdTesting.loadSetups().forEach(setup => {

            // Assemble setup name
            let options = setup.devices
            let setupName = Object.keys(options).map(key => options[key].name).join(', ')

            it('on ' + setupName, function () {
                let imageUrlA

                let devices = xdTesting.multiremote(options).init()
                devices = test.adapter.pairDevicesViaURL(devices, test.baseUrl)
                return devices
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
