"use strict"

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert
var xdTesting = require('../../lib/index')
var templates = require('../../lib/templates')
var q = require('q')

describe('MultiDevice - selectById', function () {
    var test = this

    // Config
    beforeEach(() => {
        xdTesting.reset()
        test.baseUrl = "http://localhost:8090/"
    })

    // Reset config
    afterEach(xdTesting.reset)

    it('should act on the specified devices @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome(),
            C: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .selectById(['B', 'C'], selectedDevices => selectedDevices
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
            )
            .end()
    })

    it('should not act on other devices @large', function () {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome(),
            C: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .init()
            .url(test.baseUrl)
            .selectById(['B', 'C'], selectedDevices => selectedDevices
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '-')))
                .click('#button')
                .getText('#counter').then((textB, textC) => [textB, textC].forEach(text => assert.equal(text, '1')))
            )
            .selectById('A', device => device
                .getText('#counter').then(textA => assert.equal(textA, '-'))
            )
            .end()
    })

    describe('with complementCallback', () => {
        it('should call the complementCallback on the complementary selection', () => {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options)
                .selectById('A',
                    selectedDevices => selectedDevices
                        .getDeviceIds().then(ret => assert.deepEqual(ret.value, ['A'])),
                    otherDevices => otherDevices
                        .getDeviceIds().then(ret => assert.deepEqual(ret.value, ['B']))
                )
        })

        it.skip('IDEA: could return callback result to complementCallback', () => {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options)
                .selectById('A',
                    selectedDevices => selectedDevices
                        .then(() => 'X'),
                    otherDevices => otherDevices
                        .then(value => assert.equal(value, 'X'))
                )
        })

        it('should respect promise chain', () => {
            var options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            let queue = '0'
            return xdTesting.multiremote(options)
                .then(() => queue += '1')
                .selectById('A',
                    selectedDevices => {
                        queue += '2'
                        return selectedDevices
                            .then(() => queue += '3')
                            .getDeviceIds().then(ret => assert.deepEqual(ret.value, ['A']))
                            .then(() => {
                                var defer = q.defer()
                                defer.resolve()
                                return defer.promise.delay(1000).then(() => queue += '4')
                            })
                            .then(() => queue += '5')
                    },
                    otherDevices => {
                        queue += '6'
                        return otherDevices
                            .then(() => queue += '7')
                            .getDeviceIds().then(ret => assert.deepEqual(ret.value, ['B']))
                            .then(() => {
                                var defer = q.defer()
                                defer.resolve()
                                return defer.promise.delay(1000).then(() => queue += '8')
                            })
                            .then(() => queue += '9')
                    }
                )
                .then(() => queue += 'A')
                .then(() => assert.equal(queue, '0123456789A'))
        })
    })

    it('should respect promise chain @medium', function() {
        var options = {A: templates.devices.chrome(), B: templates.devices.chrome(), C: templates.devices.chrome()}

        var queue = ''
        return xdTesting.multiremote(options)
            .then(() => queue += '0')
            .selectById(['B', 'C'], selectedDevices => {
                queue += '1'
                return selectedDevices
                    .then(() => queue += '2')
                    .then(() => {
                        var defer = q.defer()
                        defer.resolve()
                        return defer.promise.delay(1000).then(() => queue += '3')
                    })
                    .then(() => queue += '4')
            })
            .then(() => queue += '5')
            .then(() => assert.equal(queue, '012345'))
    })

    it('should adapt options to selection @medium', function() {
        var options = {
            A: templates.devices.nexus10(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus4()
        }

        return xdTesting.multiremote(options)
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
    })

    it('should deny undefined ids @medium', function() {
        var options = {
            A: templates.devices.nexus10(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus4()
        }

        return xdTesting.multiremote(options)
            .selectById(['Z'], () => {})
            .then(result => {
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result)
            }, error => {
                assert.instanceOf(error, Error)
                assert.equal(error.message, 'browser "Z" is not defined')
            })
    })

    it('should accept an array of ids @medium', () => {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .selectById(['A', 'B'], selectedDevices => selectedDevices
                .getDeviceIds().then(ret => assert.deepEqual(ret.value, ['A', 'B']))
            )
    })

    it('should accept a single id @medium', () => {
        var options = {
            A: templates.devices.chrome(),
            B: templates.devices.chrome()
        }

        return xdTesting.multiremote(options)
            .selectById('A', selectedDevices => selectedDevices
                .getDeviceIds().then(ret => assert.deepEqual(ret.value, ['A']))
            )
    })

    it('should support nested usage @medium', function() {
        var options = {
            A: templates.devices.nexus10(),
            B: templates.devices.nexus4(),
            C: templates.devices.nexus4()
        }

        let queue = ''
        return xdTesting.multiremote(options)
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

        let commandHistoryFilter = element => ['screenshot', 'saveScreenshot', 'setImplicitDeviceSelection', 'windowHandleSize'].indexOf(element.name) === -1

        xdTesting.baseUrl = null
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

    it('should support ids callback parameter @medium', () => {
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
    })

    describe('without callback @medium', () => {

        it('should return device selection', () => {
            let options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            return xdTesting.multiremote(options)
                .getCount().then(count => assert.equal(count, 2))
                .selectById('A')
                .getCount().then(count => assert.equal(count, 1))
        })

        it('should execute the commands in order', () => {
            let options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            let queue = ''

            return xdTesting.multiremote(options)
                .then(() => queue += '0')
                .getCount().then(count => assert.equal(count, 2))
                .then(() => queue += '1')
                .selectById('A')
                .then(() => queue += '2')
                .getCount().then(count => assert.equal(count, 1))
                .then(() => queue += '3')
                .then(() => assert.equal(queue, '0123'))
        })

        it('should allow to break the selection chain and run async forks', () => {
            let options = {
                A: templates.devices.chrome(),
                B: templates.devices.chrome()
            }

            let queue = []

            let devices = xdTesting.multiremote(options)
                .getCount().then(count => assert.equal(count, 2))
                .then(() => queue.push('0'))

            let A = devices
                .then(() => queue.push('1'))
                .selectById('A')
                .then(() => queue.push('2'))
                .getCount().then(count => assert.equal(count, 1))
                .then(() => queue.push('3'))

            let B = devices
                .then(() => queue.push('4'))
                .selectById('B')
                .then(() => queue.push('5'))
                .getCount().then(count => assert.equal(count, 1))
                .then(() => queue.push('6'))

            return devices
                .then(() => q.all([A, B]))
                .then(() => assert.equal(queue.sort().join(''), '0123456'))
        })
    })

})
