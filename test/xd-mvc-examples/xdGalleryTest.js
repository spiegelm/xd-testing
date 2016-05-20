"use strict";

var assert = require('chai').assert
var utility = require('../../lib/utility')
var xdTesting = require('../../lib/index')
var templates = xdTesting.templates

/**
 * @type {Q}
 */
var q = require('q');

/**
 * Resolve templates
 * @param config
 */
function normalizeConfig(config) {
    config['setups'].forEach(setup => {
        Object.keys(setup.devices).forEach(id => {
            var deviceConfig = setup.devices[id];
            if (typeof deviceConfig == "string" && templates.devices[deviceConfig]) {
                // Replace template reference
                setup.devices[id] = templates.devices[deviceConfig]();
            }
        })
    });
}

var config = require(process.cwd() + '/xd-testing.json');
normalizeConfig(config);
var setups = config['setups'];


describe('XD-MVC Gallery @large', function () {
    var test = this

    // Set test timeout
    test.timeout(180 * 1000)
    test.async_timeout = utility.waitforTimeout = 30 * 1000

    /**
     * @type {WebdriverIO.Client}
     */
    test.devices = {}
    test.baseUrl = "http://localhost:8082/gallery.html"

    // Bind function to this reference
    test.adapter = require('../../lib/adapter/xdmvc')
    var initWithDevices = utility.initWithDevices.bind(this)

    describe('eventLogger', () => {
        it('should count XDconnection events', () => {
            let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

            let loadedUrlA
            return test.devices = xdTesting.multiremote(options).init()
                .url(test.baseUrl)
                .execute(test.adapter.injectEventLogger)
                .execute(test.adapter.getEventCounter)
                .then(function (retA) {
                    console.log(retA.value)
                    assert.equal(retA.value.XDconnection, 0)
                })
                // Share url from A to B
                .then(() => console.log('share url from A to B'))
                .getUrl().then(urlA => loadedUrlA = urlA)
                .selectById('B', B => B
                    .url(loadedUrlA)
                    .execute(test.adapter.injectEventLogger)
                )
                .then(() => console.log('shared url'))
                // Assert connection event
                // TODO wait until B is initialized
                .execute(test.adapter.getEventCounter)
                .then(function (retA) {
                    console.log(retA.value)
                    assert.equal(retA.value.XDconnection, 1)
                })
                .end()
        })
    })

    it('should pair two devices via url', () => {
        let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

        test.devices = initWithDevices(options)
        test.devices = test.adapter.pairDevicesViaURL(test.devices, test.baseUrl)
        return test.devices
            .then(() => console.log('paired'))
            .selectById('A', device => device
                .then(() => console.log('get event counter..'))
                .execute(test.adapter.getEventCounter)
                .then(ret => {
                    console.log('got event counter', ret.value)
                    assert.equal(ret.value.XDconnection, test.devicesCount() - 1)
                })
            )
            .end()
    });

    describe('prerequisites', () => {
        it('browsers should not share cookies between sessions', () => {
            let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

            test.devices = initWithDevices(options)
            test.devices = test.adapter.pairDevicesViaURL(test.devices, test.baseUrl)
            return test.devices
                .selectById('A', deviceA => deviceA
                    // Set cookie and verify it's there
                    .setCookie({name: 'test_cookieA', value: 'A'})
                    .getCookie('test_cookieA').then(function (cookie) {

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
                    .getCookie('test_cookieA').then(cookie => {
                        assert.equal(cookie, null)
                    })
                )
        })

        it('browsers should not share local storage between sessions', () => {
            let options = {A: templates.devices.chrome(), B: templates.devices.chrome()}

            test.devices = initWithDevices(options)
            test.devices = test.adapter.pairDevicesViaURL(test.devices, test.baseUrl)
            return test.devices
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

        setups.forEach(setup => {

            // Assemble setup name
            let setupName = Object.keys(setup.devices).map(key => setup.devices[key].name).join(', ')

            it('on ' + setupName, function () {
                let imageUrlA
                let urlA
                let allButA

                test.devices = initWithDevices(setup.devices)
                test.devices = test.adapter.pairDevicesViaURL(test.devices, test.baseUrl)
                return test.devices
                    .name(setupName)
                    .checkpoint('load app')
                    .selectById('A', deviceA => deviceA
                        .waitForVisible('h2.gallery-overview', test.async_timeout)
                        .click('//*[text()="Bike Tours"]')
                        .waitForVisible('#gallery img:nth-of-type(1)', test.async_timeout)
                        .checkpoint('select album')
                        .click('#gallery img:nth-of-type(1)')
                        .waitForVisible('#image img', test.async_timeout)
                        .scroll('#image img')
                        .checkpoint('click thumbnail')
                        .getAttribute('#image img', 'src').then(src => {
                            imageUrlA = src;
                        })
                        .getUrl().then(function (url) {
                            urlA = url
                        })
                    )
                    .getDeviceIds().then(ret => {
                        let deviceIds = ret.value
                        allButA = deviceIds.filter(deviceId => deviceId != 'A')
                    })
                    .selectById(() => allButA, otherDevices => otherDevices
                        .waitForVisible('#image img', test.async_timeout)
                        .checkpoint('click thumbnail')
                        .getAttribute('#image img', 'src')
                    )
                    .then(function() {
                        let srcs = arguments
                        Object.keys(srcs).forEach(key => {
                            var src = srcs[key]
                            assert.equal(src, imageUrlA)
                        })
                    })
                    .checkpoint('end')
                    .end()
            })
        })
    })
})
