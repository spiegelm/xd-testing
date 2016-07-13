"use strict";

/**
 * @type Chai.Assert
 */
var assert = require('chai').assert
var fs = require('fs')
var Flow = require('../../lib/flow/flow')
var Device = require('../../lib/flow/device')
var Checkpoint = require('../../lib/flow/checkpoint')
var Step = require('../../lib/flow/step')
var path = require('path')


describe('Flow @small', function () {

    const FLOW_TEST_FILE = 'steps_test.json'

    describe('#load', function () {
        it('returns the flow with devices stored by #store', function () {
            let flow = new Flow().setName('test').addDevices([new Device({id: 'A'})]).store(FLOW_TEST_FILE)

            let loadedFlow = Flow.load(FLOW_TEST_FILE)

            fs.unlinkSync(FLOW_TEST_FILE)

            assert.lengthOf(Object.keys(loadedFlow.devices), 1);
            assert.deepEqual(loadedFlow.toJSON(), flow.toJSON());
        });
    })

    describe('#sha', function () {
        describe('returns equal hashes', function() {
            it('for new flows', function() {
                assert.equal(
                    new Flow().sha(),
                    new Flow().sha()
                )
            })
            it('for equal flows with names', function() {
                assert.equal(
                    new Flow().setName('a').sha(),
                    new Flow().setName('a').sha()
                )
            })
            it('for equal devices without steps', function() {
                assert.equal(
                    new Flow().setName('a').addDevices([new Device({id: 'A'})]).sha(),
                    new Flow().setName('a').addDevices([new Device({id: 'A'})]).sha()
                )
            })
            it('for equal devices with steps without checkpoint', function() {
                assert.equal(
                    new Flow().setName('a').addDevices([new Device({id: 'A'}).addStep(new Step(0, 'command', null))]).sha(),
                    new Flow().setName('a').addDevices([new Device({id: 'A'}).addStep(new Step(0, 'command', null))]).sha()
                )
            })
            it('for equal devices with checkpoints and steps', function() {
                assert.equal(
                    new Flow().setName('a').addDevices([
                        new Device({id: 'A'}).addCheckpoint(
                            new Checkpoint(0, 'checkpoint').addSteps([
                                new Step(0, 'command0', null),
                                new Step(1, 'command1', null)
                            ])
                        )
                    ]).sha(),
                    new Flow().setName('a').addDevices([
                        new Device({id: 'A'}).addCheckpoint(
                            new Checkpoint(0, 'checkpoint').addSteps([
                                new Step(0, 'command0', null),
                                new Step(1, 'command1', null)
                            ])
                        )
                    ]).sha()
                )
            })
            it('for equal devices with checkpoints and steps', function() {
                assert.equal(
                    new Flow().setName('a').addDevices([
                        new Device({id: 'A'}).addCheckpoint(
                            new Checkpoint(0, 'checkpoint').addSteps([
                                new Step(0, 'command0', new Buffer([13, 37])),
                                new Step(1, 'command1', new Buffer([13, 37]))
                            ])
                        )
                    ]).sha(),
                    new Flow().setName('a').addDevices([
                        new Device({id: 'A'}).addCheckpoint(
                            new Checkpoint(0, 'checkpoint').addSteps([
                                new Step(0, 'command0', new Buffer([13, 37])),
                                new Step(1, 'command1', new Buffer([13, 37]))
                            ])
                        )
                    ]).sha()
                )
            })
        })

        describe('returns different hashes', function() {
            it('for flows with different names', function() {
                assert.notEqual(
                    new Flow().setName('b').sha(),
                    new Flow().setName('a').sha()
                )
            })
            it('for flows with different devices', function() {
                assert.notEqual(
                    new Flow().addDevices([new Device({id: 'A'})]).sha(),
                    new Flow().addDevices([new Device({id: 'B'})]).sha()
                )
            })
            it('for flows with different step count', function() {
                assert.notEqual(
                    new Flow().addDevices([new Device({id: 'A'}).addStep(new Step(0, 'command', null))]).sha(),
                    new Flow().addDevices([new Device({id: 'B'})]).sha()
                )
            })
            it('for flows with different steps', function() {
                assert.notEqual(
                    new Flow().addDevices([new Device({id: 'A'}).addStep(new Step(0, 'command', null))]).sha(),
                    new Flow().addDevices([new Device({id: 'B'}).addStep(new Step(1, 'command', null))]).sha()
                )
            })
            it('for devices different step images', function() {
                assert.notEqual(
                    new Flow().setName('a').addDevices([
                        new Device({id: 'A'}).addCheckpoint(
                            new Checkpoint(0, 'checkpoint').addSteps([
                                new Step(0, 'command0', new Buffer([13, 37])),
                                new Step(1, 'command1', new Buffer([13, 37]))
                            ])
                        )
                    ]).sha(),
                    new Flow().setName('a').addDevices([
                        new Device({id: 'A'}).addCheckpoint(
                            new Checkpoint(0, 'checkpoint').addSteps([
                                new Step(0, 'command0', new Buffer([13, 37])),
                                new Step(1, 'command1', new Buffer([13, 39]))
                            ])
                        )
                    ]).sha()
                )
            })

        })
    })

    describe('#setName', function () {
        it('should set the name', function() {
            let FlowName = 'FlowName'
            assert.equal(FlowName, new Flow().setName(FlowName).name)
        })

        it('should deny non-string values', function() {
            assert.throws(() => {
                new Flow().setName(undefined)
            }, TypeError)

            assert.throws(() => {
                new Flow().setName(1)
            }, TypeError)
        })
    })

    describe('#addDevice', function () {
        it('adds the device to the devices array')
            //, function () {
            //        assert.deepEqual(
            //            (new Flow())
            //                .addStep(new Step('A', 13, 'commandName', new Buffer([])))
            //                .addStep(new Step('B', 14, 'commandName', new Buffer([])))
            //                .addStep(new Step('C', 15, 'commandName', new Buffer([])))
            //                .addStep(new Step('A', 13, 'commandName', new Buffer([])))
            //                .addStep(new Step('B', 14, 'commandName', new Buffer([])))
            //                .addStep(new Step('C', 15, 'commandName', new Buffer([])))
            //                .devices(),
            //            ['A', 'B', 'C']
            //        );
            //})
    })

    describe('#compressSteps', function () {
        describe('prerequisites', function() {
            it('same Buffer objects should equal', function () {
                assert.isTrue((new Buffer([13, 37]).equals(new Buffer([13, 37]))));
            })

            it('different Buffer objects should not equal', function () {
                assert.isNotTrue((new Buffer([13, 38]).equals(new Buffer([13, 37]))));
            })

            it('array.concat returns concatenated array', function () {
                assert.deepEqual(['A'].concat(['B']), ['A', 'B'])
            })
        })

        it('merges consecutive steps with identical screen shots of the same device')
            /*, function () {
            let step0 = new Step('A', 13, 'commandA', new Buffer([13, 37])),
                step1 = new Step('A', 14, 'commandB', new Buffer([13, 37]))
            let compressedSteps = (new Flow())
                .addStep(step0)
                .addStep(step1)
                .compressSteps()
                .steps

            assert.lengthOf(compressedSteps, 1);
            assert.isTrue(step0.image.equals(compressedSteps[0].image));

            // TODO test other step properties

            assert.deepEqual(compressedSteps[0].commands, ['commandA', 'commandB'])
            assert.equal(compressedSteps[0].deviceId, 'A')
        })
        */

        it('does not merge checkpoints with following steps') /*, function() {
            let step0 = new Step('A', 13, 'commandA', new Buffer([13, 37]), {}, true),
                step1 = new Step('A', 14, 'commandB', new Buffer([13, 37]), {}, true),
                step2 = new Step('A', 15, 'commandC', new Buffer([13, 37]), {}, false)
            let compressedSteps = (new Flow())
                .addStep(step0)
                .addStep(step1)
                .addStep(step2)
                .compressSteps()
                .steps

            assert.lengthOf(compressedSteps, 3);
            assert.isTrue(step0.image.equals(compressedSteps[0].image));
            assert.isTrue(step1.image.equals(compressedSteps[1].image));
            assert.isTrue(step2.image.equals(compressedSteps[2].image));
        })
        */
    })

    describe('#grid', function() {
        it('x test' /*, function() {
            let FLOW_TEST_FILE = path.join(__dirname, 'fixtures', 'flow.json')
            Flow.load(FLOW_TEST_FILE).grid()

            // TODO finish test
        }*/)
    })

    describe('#generateStepId', function() {
        // TODO write test
        it('returns the count of stored steps')
    })

    describe('#generateCheckpointId', function() {
        // TODO write test
        it('returns the count of stored checkpoints')
    })
})

