"use strict";

/**
 * @type Chai.Assert
 */
var assert = require('chai').assert
var fs = require('fs')
var Flow = require('../../lib/flow/flow')
var Device = require('../../lib/flow/device')
var Step = require('../../lib/flow/step')
var path = require('path')


describe('Flow @small', function () {

    const FLOW_TEST_FILE = 'steps_test.json'

    describe('#load', function () {
        it('should return the flow with devices stored by #store', function () {
            let flow = new Flow().addDevices([new Device({id: 'A'})]).store(FLOW_TEST_FILE)

            let loadedFlow = Flow.load(FLOW_TEST_FILE)

            fs.unlinkSync(FLOW_TEST_FILE)

            assert.lengthOf(Object.keys(loadedFlow.devices), 1);
            assert.deepEqual(loadedFlow, flow);
        });
    })

    //describe('#devices', function () {
    //    it('should return a list of devices contained in the steps', function () {
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
    //    })
    //})

    describe('#compressSteps', function () {
        it('same Buffer objects should equal', function () {
            assert.isTrue((new Buffer([13, 37]).equals(new Buffer([13, 37]))));
        })

        it('different Buffer objects should not equal', function () {
            assert.isNotTrue((new Buffer([13, 38]).equals(new Buffer([13, 37]))));
        })

        it('array.concat works', function () {
            assert.deepEqual(['A'].concat(['B']), ['A', 'B'])
        })

        it('should merge consecutive steps with identical screen shots of the same device')
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

        it('should not merge checkpoints with following steps') /*, function() {
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

    //describe('#fixCommandAlignment', function() {
    //    it('should move the first screen shot in a separate step', function() {
    //        let step0 = new Step('A', 0, 'commandA', new Buffer([13, 37]), {}, true)
    //
    //        let alignedSteps = (new Flow())
    //            .addStep(step0)
    //            .fixCommandAlignment()
    //            .steps
    //
    //        assert.lengthOf(alignedSteps, 2);
    //
    //        assert.isNotNull(alignedSteps[0].image)
    //        assert.equal(alignedSteps[0].image.toString('base64'), (new Buffer([13, 37])).toString('base64'), 'first step should keep the screenshot');
    //        assert.isTrue(alignedSteps[0].image.equals((new Buffer([13, 37]))), 'first step should keep the screenshot');
    //        assert.equal(alignedSteps[0].stepId, 0)
    //        assert.deepEqual(alignedSteps[0].commands, [], 'commands don\'t match')
    //
    //        assert.deepEqual(alignedSteps[1].commands, step0.commands)
    //        assert.isTrue(alignedSteps[1].image.equals(new Buffer([])))
    //    })
    //})
    //
    //describe('#addCheckpoint', function() {
    //    it('adds a new checkpoint to the checkpoints array', function() {
    //        let step0 = new Step('A', 0, 'commandA', new Buffer([13, 37]), {}, true)
    //
    //        let flow = (new Flow()).addStep(step0)
    //
    //        flow.addCheckpoint('A', 'checkpoint')
    //        assert.lengthOf(flow.checkpoints, 1)
    //        assert.deepEqual(flow.checkpoints[0].stepIds, [0])
    //    })
    //})

    describe('#grid', function() {
        it('x test', function() {
            let FLOW_TEST_FILE = __dirname + path.sep + 'steps.json'
            Flow.load(FLOW_TEST_FILE).grid()

            // TODO finish test
        })
    })

    describe('#generateStepId', function() {
        // TODO write test
        it('should return the count of stored steps')
    })

    describe('#generateCheckpointId', function() {
        // TODO write test
        it('should return the count of stored checkpoints')
    })
})

