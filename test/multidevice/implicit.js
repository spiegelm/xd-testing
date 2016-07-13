"use strict"

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - implicit', function () {
    let test = this

    test.baseUrl = "http://localhost:8090/"

    let testApp = {
        button: {
            url: test.baseUrl,
            buttonSelector: '#button'
        },
        scroll: {
            url: test.baseUrl + 'scroll.html',
            urlWithButton: withButton => testApp.scroll.url + '?hideButton=' + (withButton ? 0 : 1),
            buttonSelector: '#button'
        }
    }
    let urlWithButton = withButton => testApp.button.url + "?hideButton=" + (withButton ? 0 : 1)

    describe('prerequisites', () => {
        it('urlWithButton returns correct url @small', () => {
            assert.equal(urlWithButton(false), "http://localhost:8090/?hideButton=1")
            assert.equal(urlWithButton(true), "http://localhost:8090/?hideButton=0")
        })

        it('testapp shows button per default @large', () => {
            var options = {
                A: templates.devices.chrome()
            }

            return xdTesting.multiremote(options).init()
                .url(testApp.button.url)
                .isVisible(testApp.button.buttonSelector).then(visible => assert.isTrue(visible))
                .end()
        })

        it('testapp /?hideButton=1 hides button @large', () => {
            var options = {
                A: templates.devices.chrome()
            }

            return xdTesting.multiremote(options).init()
                .url(urlWithButton(false))
                .isVisible(testApp.button.buttonSelector).then(visible => assert.isFalse(visible))
                .end()
        })
    })

    it('should not use implicit device selection per default @medium', function() {
        var options = {
            A: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .getAddressingOptions()
            .then(addr => assert.equal(addr.implicit, false))
    })

    it('should set implicit device selection @medium', function () {
        var options = {
            A: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .implicit(devices => devices
                .getAddressingOptions()
                .then(addr => assert.equal(addr.implicit, true))
            )
    })

    describe('.forEach callback @medium', () => {
        it('should be called on all matching devices', () => {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            let counter = 0

            return xdTesting.multiremote(options)
                .implicit(devices => devices
                    .forEach(device => counter++)
                )
                .then(() => assert.equal(counter, 2, "Failed asserting that callback was called on all devices"))
        })
    })

    it('.getCount should return undefined @medium', () => {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .implicit(devices => devices
                .getCount().then(count => assert.strictEqual(count, undefined, "Failed asserting that getCount returns undefined."))
            )
    })

    it('should execute callback in order @medium', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        var queue = ''
        return xdTesting.multiremote(options)
            .then(() => queue += '0')
            .implicit(device => {
                queue += '1'
                return device.then(() => {
                    queue += '2'
                })
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
    })

    it('should return the implicit selection context when no callback is given @medium', () => {
        var options = {
            A: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .getAddressingOptions().then(addr => assert.equal(addr.implicit, false))
            .implicit()
            .getAddressingOptions().then(addr => assert.equal(addr.implicit, true))
    })


    describe('should select matching devices @large', () => {
        it('for element related commands', () => {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options).init()
                .forEach((device, index) => device.url(urlWithButton(index === 0)))
                .implicit(devices => devices
                    .click('#button')
                )
                .forEach((device, index) => device
                    .getText('#counter').then(text => assert.equal(text, index === 0 ? '1' : '-'))
                )
                .end()
        })

        it('for optional element related commands with provided selector', () => {
            var options = {
                A: templates.devices.nexus4(),
                B: templates.devices.nexus4()
            }

            let app = testApp.scroll
            return xdTesting.multiremote(options).init()

                // TODO simulate the device screen size!
                .windowHandleSize({width: options.A.width, height: options.A.height})

                // Show the button only on device A
                .forEach(device => device
                    .url(app.urlWithButton(device.options.id === 'A'))
                    .isVisible(app.buttonSelector).then(visible => assert.equal(visible, device.options.id === 'A'))
                )
                // Get scroll offsets
                .execute(function() {
                    return window.pageYOffset || document.documentElement.scrollTop
                })
                .then((resultA, resultB) => [resultA, resultB].map(result => result.value))
                .then((topA, topB) => {
                    assert.equal(topA, 0)
                    assert.equal(topB, 0)
                })
                // Scroll to button on matching device A
                .implicit(devices => devices
                    .scroll(testApp.scroll.buttonSelector)
                )
                // Verify scroll offsets
                .execute(function() {
                    return window.pageYOffset || document.documentElement.scrollTop
                })
                .then((resultA, resultB) => [resultA, resultB].map(result => result.value))
                .then((topA, topB) => {
                    assert.isAtLeast(topA, 10)
                    assert.equal(topB, 0)
                })
                .end()
        })

        it.skip('for commands related to two elements', () => {
            // Omitted implementation, so nothing to test
            // Basically it's only the drag and drop command
        })
    })

    describe('should select all devices', () => {
        it('for optional element related commands without provided selector @large', () => {
            var options = {
                A: templates.devices.nexus4(),
                B: templates.devices.nexus4()
            }

            let app = testApp.scroll
            return xdTesting.multiremote(options).init()

                // TODO simulate the device screen size!
                .windowHandleSize({width: options.A.width, height: options.A.height})

                // Show the button only on device A
                .forEach(device => device
                    .url(app.urlWithButton(device.options.id === 'A'))
                    .isVisible(app.buttonSelector).then(visible => assert.equal(visible, device.options.id === 'A'))
                )
                // Get scroll offsets
                .execute(function() {
                    return window.pageYOffset || document.documentElement.scrollTop
                })
                .then((resultA, resultB) => [resultA, resultB].map(result => result.value))
                .then((topA, topB) => {
                    assert.equal(topA, 0)
                    assert.equal(topB, 0)
                })
                // Scroll down on all devices
                .implicit(devices => devices
                    .scroll(0, 1000)
                )
                // Verify scroll offsets
                .execute(function() {
                    return window.pageYOffset || document.documentElement.scrollTop
                })
                .then((resultA, resultB) => [resultA, resultB].map(result => result.value))
                .then((topA, topB) => {
                    assert.isAtLeast(topA, 10)
                    assert.isAtLeast(topB, 10)
                })
                .checkpoint('end')
                .end()
        })

        it('for non-element related commands @large', () => {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options).init()
                .implicit(devices => devices
                    .url(testApp.button.url)
                    .getUrl().then((urlA, urlB) => {
                        assert.equal(urlA, testApp.button.url)
                        assert.equal(urlB, testApp.button.url)
                    })
                )
                .end()
        })

    })

    it('should fail if no device matches', () => {
        var options = {
            A: templates.devices.chrome()
        }

        return xdTesting.multiremote(options).init()
            .url(urlWithButton(false))
            .implicit(devices => devices
                .click('#button')
                .then(result => {
                    throw new Error('Promise was unexpectedly fulfilled. Result: ' + result)
                }, error => {
                    assert.instanceOf(error, Error)
                    assert.match(error.message, /Failed to select a device with visible element.*#button.*No such device/)
                })
            )
            .end()
    })
})
