"use strict"

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var Flow = require('../../lib/flow/flow')
var q = require('q')

describe('xdTesting', function() {

    let test = this
    test.fixture = {
        xd_gallery: {
            url: 'http://localhost:8082/gallery.html'
        },
        basic_app: {
            url: 'http://localhost:8090/'
        }
    }

    describe('command arguments @large', function () {
        it('are part of a step\'s command name', function () {
            let scenario = {A: templates.devices.chrome()}
            return xdTesting.multiremote(scenario).init()
                .url(test.fixture.basic_app.url)
                .click('#button')
                .checkpoint('check')
                .getFlow().then(flow => {
                    let steps = flow.steps()
                    let stepCommandNames = steps.map(step => step.commands)
                        .filter(commands => commands.length > 0)
                    assert.lengthOf(stepCommandNames, 3)
                })
                .end()
        })
    })

    describe('#getFlow @large', function () {
        it('returns the flow object', function () {
            let scenario = {A: templates.devices.chrome()}
            return xdTesting.multiremote(scenario).init()
                .url(test.fixture.basic_app.url)
                .click('#button')
                .checkpoint('end')
                .getFlow().then(flow => {
                    assert.instanceOf(flow, Flow)
                    assert.property(flow, 'devices')
                    assert.deepPropertyVal(flow, 'devices.A.deviceId', 'A')
                })
                .end()

        })
    })


    describe('app framework integration', () => {

        beforeEach(() => {
            // Reset config
            xdTesting.baseUrl = null
        })

        it('should load xdTesting.baseUrl after init @large', () => {
            let options = {
                A: templates.devices.chrome()
            }

            xdTesting.baseUrl = 'http://localhost/'

            return xdTesting.multiremote(options).init()
                .getUrl().then(url => assert.equal(url, xdTesting.baseUrl))
                .end()
        })

        it('should not load xdTesting.baseUrl if it\'s not set @large', () => {
            let options = {
                A: templates.devices.chrome()
            }

            xdTesting.baseUrl = null

            return xdTesting.multiremote(options).init()
                .getUrl().then(url => assert.equal(url, 'data:,'))
                .end()
        })

        describe('for XD-MVC', () => {

            // Define a custom adapter
            xdTesting.appFramework = xdTesting.adapter.xdmvc

            it('app property has devices @medium', () => {
                let options = {
                    A: templates.devices.chrome()
                }

                let devices = xdTesting.multiremote(options)
                let app = devices
                    .app()

                assert.property(app, 'devices')
                assert.isDefined(app.devices)

                return devices.end()
            })

            it('app property should have getEventCounter @medium', () => {
                let options = {
                    A: templates.devices.chrome()
                }

                let devices = xdTesting.multiremote(options)
                let app = devices
                    .app()

                assert.property(app, 'getEventCounter')
                assert.instanceOf(app.getEventCounter, Function)

                return devices.end()
            })

            it('should get the event counter @large', () => {
                let options = {
                    A: templates.devices.chrome()
                }
                return xdTesting.multiremote(options).init()
                    .url(test.fixture.xd_gallery.url)
                    .app().injectEventLogger()
                    .app().getEventCounter().then(counter => {
                        assert.property(counter, 'XDdisconnection')
                        assert.property(counter, 'XDconnection')
                        assert.property(counter, 'XDdevice')
                        assert.property(counter, 'XDroles')
                        assert.property(counter, 'XDsync')
                        assert.property(counter, 'XDserverReady')
                        assert.property(counter, 'XDothersRolesChanged')

                        assert.typeOf(counter['XDdisconnection'], 'number')
                        assert.typeOf(counter['XDconnection'], 'number')
                        assert.typeOf(counter['XDdevice'], 'number')
                        assert.typeOf(counter['XDroles'], 'number')
                        assert.typeOf(counter['XDsync'], 'number')
                        assert.typeOf(counter['XDserverReady'], 'number')
                        assert.typeOf(counter['XDothersRolesChanged'], 'number')
                    })
                    .end()

                    /**
                     * App property?
                     */

                    //// Pair devices via url
                    //.app.pairDevicesViaUrl()
                    // Get event counter
                    //.app.getEventCounter().then(counter => assert.equal(counter.XDconnection == 1))
                // Wait for the next event of a type
                //.app.waitForEvent('XDconnection')
                //// Wait until the event type counter equals a value
                //.app.waitForEventCount('XDconnection', 2)
                //// Custom command
                //.app.addCommand('pairDevicesViaGUI', function() {
                //    return this.click(...)
                //})
            })

            describe('pairDevicesViaUrl', () => {
                it('should pair a device with a other device', () => {
                    let options = {
                        A: templates.devices.chrome(),
                        B: templates.devices.chrome()
                    }
                    let urlA
                    return xdTesting.multiremote(options).init()
                        .app().pairDevicesViaURL(test.fixture.xd_gallery.url)
                        .getUrl().then((urlA, urlB) => {
                            assert.include(urlA, test.fixture.xd_gallery.url)
                            assert.strictEqual(urlA, urlB)
                        })
                        .end()
                })
            })

            describe('pairDevicesViaXDMVC', () => {
                it('should pair a device with a other device', () => {
                    let options = {
                        A: templates.devices.chrome(),
                        B: templates.devices.chrome()
                    }
                    let urlA
                    return xdTesting.multiremote(options).init()
                        .url(test.fixture.xd_gallery.url)
                        .app().pairDevicesViaXDMVC()
                        .app().getEventCounter().then((counterA, counterB) => {
                            assert.equal(counterA['XDconnection'], 1)
                            assert.equal(counterB['XDconnection'], 1)
                        })
                        .end()
                })
            })

            describe('waitForEvent', () => {
                it('should wait for the next event of the given type', () => {
                    let options = {
                        A: templates.devices.chrome()
                    }

                    let queue = ''
                    let lastCounter
                    let devices = xdTesting.multiremote(options).init()
                        .url(test.fixture.xd_gallery.url)
                        .app().injectEventLogger()
                        .app().getEventCounter()
                        .then(counter => lastCounter = counter)
                        .then(() => queue += '0')
                        // Init a custom event counter
                        .execute(function() {
                            window.eventLogger.eventCounter['customEvent'] = 0
                        })
                        .then(() => queue += '1')

                    let waitFor = devices
                        .then(() => queue += '2')
                        .app().waitForEvent('customEvent')
                        .then(() => queue += '9')
                        .end()

                    let trigger = devices
                        .then(() => q.delay(1000))
                        .then(() => queue += '3')
                        .execute(function() {
                            window.eventLogger.eventCounter['customEvent'] = 1
                        })
                        .then(() => queue += '4')

                    return waitFor
                        .then(() => assert.equal(queue, '012349'))
                })
        })

    })
})
