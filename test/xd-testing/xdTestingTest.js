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

    // Reset config
    beforeEach(function() {
        this.timeout(180 * 1000)
        xdTesting.reset()
    })
    afterEach(xdTesting.reset)

    describe('prerequisites @large', () => {
        it('browsers should not share cookies between sessions', () => {
            let options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options).init()
                .url(test.fixture.basic_app.url)
                .selectById('A', deviceA => deviceA
                    // Set cookie and verify it's there
                    .setCookie({name: 'test_cookieA', value: 'A'})
                    .getCookie('test_cookieA').then(cookie => {
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
                .end()
        })

        it('browsers should not share local storage between sessions', () => {
            let options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options).init()
                .url(test.fixture.basic_app.url)
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

    describe('#reset', () => {
        it('should set baseUrl to null', () => {
            xdTesting.baseUrl = 'http://localhost/'
            xdTesting.reset()
            assert.equal(xdTesting.baseUrl, null)
        })

        it('should set appFramework to null', () => {
            xdTesting.appFramework = xdTesting.adapter.xdmvc
            xdTesting.reset()
            assert.equal(xdTesting.appFramework, null)
        })

        it('should set waitForTimeout to 60s', () => {
            xdTesting.waitForTimeout = 0
            xdTesting.reset()
            assert.equal(xdTesting.waitForTimeout, 60 * 1000)
        })
    })

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

        it('should load xdTesting.baseUrl after init @large', () => {
            let options = {
                A: templates.devices.chrome()
            }

            xdTesting.baseUrl = test.fixture.basic_app.url

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
            beforeEach(() => {
                xdTesting.appFramework = xdTesting.adapter.xdmvc
            })

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
            })

            describe('pairDevicesViaUrl @large', () => {
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

            describe('pairDevicesViaXDMVC @large', () => {
                it('should pair a device with an other device', () => {
                    let options = {
                        A: templates.devices.chrome(),
                        B: templates.devices.chrome()
                    }

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

            describe('getConnectedDeviceCount', () => {
                it('for 1 device should return 0', () => {
                    let options = {
                        A: templates.devices.chrome()
                    }

                    return xdTesting.multiremote(options).init()
                        .url(test.fixture.xd_gallery.url)
                        .app().getConnectedDeviceCount()
                        .then(count => assert.equal(count, 0))
                        .end()
                })

                it('for 2 connected devices should return 1', () => {
                    let options = {
                        A: templates.devices.chrome(),
                        B: templates.devices.chrome()
                    }

                    return xdTesting.multiremote(options).init()
                        .app().pairDevicesViaURL(test.fixture.xd_gallery.url)
                        .app().getConnectedDeviceCount()
                        .then((countA, countB) => {
                            assert.equal(countA, 1)
                            assert.equal(countB, 1)
                        })
                        .end()
                })
            })

            describe('waitForConnectedDeviceCount @large', () => {
                it('for 0 connected devices should resolve immediately', () => {
                    let options = {
                        A: templates.devices.chrome()
                    }

                    return xdTesting.multiremote(options).init()
                        .url(test.fixture.xd_gallery.url)
                        .app().waitForConnectedDeviceCount(0)
                        .end()
                })

                it('for 1 connected devices should solve after connection', () => {
                    let options = {
                        A: templates.devices.chrome(),
                        B: templates.devices.chrome()
                    }

                    let queue = ''
                    let devices = xdTesting.multiremote(options).init()
                        .url(test.fixture.xd_gallery.url)
                        .then(() => queue += '0')

                    let waitFor = devices
                        .then(() => queue += '1')
                        .app().waitForConnectedDeviceCount(1)
                        .then(() => queue += '3')

                    let trigger = devices
                        .then(() => q.delay(1000))
                        .then(() => queue += '2')
                        .app().pairDevicesViaXDMVC()

                    return waitFor
                        .then(() => assert.equal(queue, '0123'))
                        .end()
                })
            })

            describe('waitForEvent @large', () => {
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

                    return waitFor
                        .then(() => assert.equal(queue, '01239'))
                        .end()
                })
            })

            describe('waitForEventCount @large', () => {
                it('should wait for the amount of events', () => {
                    let options = {
                        A: templates.devices.chrome()
                    }

                    let queue = ''
                    let devices = xdTesting.multiremote(options).init()
                        .url(test.fixture.xd_gallery.url)
                        .app().injectEventLogger()
                        .then(() => queue += '0')
                        // Init a custom event counter
                        .execute(function() {
                            window.eventLogger.eventCounter['customEvent'] = 0
                        })
                        .then(() => queue += '1')

                    let waitFor = devices
                        .then(() => queue += '2')
                        .app().waitForEventCount('customEvent', 1)
                        .then(() => queue += '4')
                        .app().waitForEventCount('customEvent', 2)
                        .then(() => queue += '9')
                        .end()

                    let trigger = devices
                        .then(() => q.delay(1000))
                        .then(() => queue += '3')
                        .execute(function() {
                            window.eventLogger.eventCounter['customEvent'] = 1
                        })
                        .then(() => q.delay(1000))
                        .then(() => queue += '5')
                        .execute(function() {
                            window.eventLogger.eventCounter['customEvent'] = 2
                        })

                    return waitFor
                        .then(() => assert.equal(queue, '0123459'))
                        .end()
                })
            })

            describe('hooks', () => {
                it('should inject event logger after loading url', () => {
                    let options = {
                        A: templates.devices.chrome()
                    }

                    xdTesting.reset()
                    xdTesting.appFramework = xdTesting.adapter.xdmvc

                    return xdTesting.multiremote(options).init()
                        .url(test.fixture.xd_gallery.url)
                        .execute(function() {
                            return window.eventLogger;
                        })
                        .then(ret => assert.isDefined(ret))
                        .app().getEventCounter().then(counter => {
                            assert.isDefined(counter)
                        })
                        .end()
                })
            })
        })

    })
})
