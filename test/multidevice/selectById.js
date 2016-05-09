"use strict"

var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - selectById', function () {
    var test = this

    test.baseUrl = "http://localhost:8090/"

    beforeEach(() => {
        test.devices = {}
    })

    afterEach(function () {
        // Close browsers before completing a test
        if (test.devices && test.devices.endAll) {
            return test.devices.endAll()
        }
    })

    it('should act on the specified devices @large', function () {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()}

        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .selectById(['B', 'C'], selectedDevices => selectedDevices
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
            )
    })

    it('should not act on other devices @large', function () {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()}

        return test.devices = xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .selectById(['B', 'C'], selectedDevices => selectedDevices
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
            ).then(() => test.devices.select('A')
                .getText('#counter').then(textA => assert.equal(textA, '-'))
            )
    })

    it('should execute promises callback @medium', function() {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()}

        var queue = ''
        return test.devices = xdTesting.multiremote(options)
            .then(() => queue += '0')
            .selectById(['B', 'C'], selectedDevices => {
                queue += '1'
                return selectedDevices.then(() => {
                    queue += '2'
                })
            })
            .then(() => queue += '3')
            .then(() => assert.equal(queue, '0123'))
            .end()
    })

    it('should adapt options to selection @medium', function() {
        var options = {
            A: templates.devices.nexus10(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus4()
        }

        return test.devices = xdTesting.multiremote(options)
            .selectById(['B', 'C'], selectedDevices => selectedDevices
                .then(() => {
                    assert.property(selectedDevices, 'options')
                    assert.notProperty(selectedDevices.options, 'A')
                    assert.property(selectedDevices.options, 'B')
                    assert.property(selectedDevices.options, 'C')
                    assert.deepEqual(selectedDevices.options.B, options.B)
                    assert.deepEqual(selectedDevices.options.C, options.C)
                })
            )
    })

    it('should keep explicit device selection @medium', function() {
        var options = {
            A: templates.devices.nexus10()
        }

        return xdTesting.multiremote(options)
            .getAddressingOptions().then(addr => assert.equal(addr.implicit, false))
            .selectById('A', device => device
                .getAddressingOptions().then(addr => assert.equal(addr.implicit, false))
            )
            .end()
    })

    it('should deny undefined ids @medium', function() {
        var options = {
            A: templates.devices.nexus10(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus4()
        }

        return xdTesting.multiremote(options)
            .selectById('Z', () => {})
            .then(result => {
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result)
            }, error => {
                assert.instanceOf(error, Error)
                assert.equal(error.message, 'browser "Z" is not defined')
            })
    })

    it('should support nested usage @medium', function() {
        var options = {
            A: templates.devices.nexus10(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus4()
        }

        let queue = ''
        return test.devices = xdTesting.multiremote(options)
            .selectById(['A', 'B', 'C'], allDevices => allDevices
                .then(() => queue += '0')
                .selectById(['B', 'C'], devicesBC => devicesBC
                    .then(() => queue += '1')
                    .selectById(['C'], deviceC => deviceC
                        .then(() => queue += '2')
                        .then(() => {
                            assert.property(deviceC, 'options')
                            assert.notProperty(deviceC.options, 'A')
                            assert.notProperty(deviceC.options, 'B')
                            assert.property(deviceC.options, 'C')
                            assert.deepEqual(deviceC.options.C, options.C)
                        })
                        .then(() => queue += '3')
                    )
                    .then(() => {
                        assert.property(devicesBC, 'options')
                        assert.notProperty(devicesBC.options, 'A')
                        assert.property(devicesBC.options, 'B')
                        assert.property(devicesBC.options, 'C')
                        assert.deepEqual(devicesBC.options.B, options.B)
                        assert.deepEqual(devicesBC.options.C, options.C)
                    })
                    .then(() => queue += '4')
                )
                .then(() => {
                    assert.equal(queue, '01234')
                    assert.property(allDevices, 'options')
                    assert.property(allDevices.options, 'A')
                    assert.property(allDevices.options, 'B')
                    assert.property(allDevices.options, 'C')
                    assert.deepEqual(allDevices.options.A, options.A)
                    assert.deepEqual(allDevices.options.B, options.B)
                    assert.deepEqual(allDevices.options.C, options.C)
                })
            )
    })

    it('should retain the command history @large', function() {
        var options = {
            A: templates.devices.nexus4(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus10()
        }

        let commandHistoryFilter = element => ['screenshot', 'saveScreenshot', 'setImplicitDeviceSelection'].indexOf(element.name) === -1

        return test.devices = xdTesting.multiremote(options)
            .init() // 1 command
            .url(test.baseUrl) // 1 command
            .click('#button') // 3 commands total
            .selectById(['A', 'B'], selectedDevices => selectedDevices
                .click('#button') // 3 commands total
                .getText('#counter') // 3 commands total
            )
            .then(() => {
                return q.all([
                    test.devices.select('A').getCommandHistory().then(h => {
                        let filteredHistory = h.filter(commandHistoryFilter)
                        assert.deepEqual(filteredHistory.map(element => element.name),
                            ['init', 'url', 'click', 'element', 'elementIdClick', 'click',
                                'element', 'elementIdClick', 'getText', 'elements', 'elementIdText']
                        )
                    }),
                    test.devices.select('B').getCommandHistory().then(h => {
                        let filteredHistory = h.filter(commandHistoryFilter)
                        assert.deepEqual(filteredHistory.map(element => element.name),
                            ['init', 'url', 'click', 'element', 'elementIdClick', 'click',
                                'element', 'elementIdClick', 'getText', 'elements', 'elementIdText']
                        )
                    }),
                    test.devices.select('C').getCommandHistory().then(h => {
                        let filteredHistory = h.filter(commandHistoryFilter)
                        assert.deepEqual(filteredHistory.map(element => element.name),
                            ['init', 'url', 'click', 'element', 'elementIdClick']
                        )
                    })
                ])
            })
            .end()
    })

    it('should support ids callback parameter', () => {
        let options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome(),
            C: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .selectById(() => ['A', 'C'], devices => devices
                .getCount()
                .then(count => assert.equal(count, 2))
            )
            .end()
    })

})
