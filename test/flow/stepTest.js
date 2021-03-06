"use strict";

/**
 * @type Chai.Assert
 */
var assert = require('chai').assert;
var Step = require('../../lib/flow/step')


describe('Step @small', function() {

    describe('prerequisites', function() {
        it('identical steps should be deep equal', function() {
            let stepA = new Step(0, ['first', 'second'], new Buffer([13, 37]))
            let stepB = new Step(0, ['first', 'second'], new Buffer([13, 37]))

            assert.deepEqual(stepA, stepB)
            assert.equal(stepA.stepId, stepB.stepId)
            assert.deepEqual(stepA.commands, stepB.commands)
            assert.deepEqual(stepA.image, stepB.image)
        })

        it('non-identical steps should not be deep equal', function() {
            let stepA = new Step(0, ['first', 'second'], new Buffer([13, 37]))
            let stepB = new Step(0, ['first', 'second'], new Buffer([13, 38]))

            assert.notDeepEqual(stepA, stepB)
            assert.equal(stepA.stepId, stepB.stepId)
            assert.deepEqual(stepA.commands, stepB.commands)
            assert.notDeepEqual(stepA.image, stepB.image)
        })
    })

    describe('#toJSON', function () {
        it('returns object with stepId, commands, image in base64 encoding', function () {
            let json = (new Step(0, ['commandName'], new Buffer([13, 37]))).toJSON()
            assert.deepEqual(json, {
                stepId: 0,
                commands: ['commandName'],
                image: new Buffer([13, 37]).toString('base64')
            })
        })
    })

    describe('#fromJSON', function () {
        it('turns an JSON object into a populated Step object', function () {
            let step = new Step(0, ['commandName'], new Buffer([13, 37]));
            assert.deepEqual(
                Step.fromJSON({
                    stepId: 0,
                    commands: ['commandName'],
                    image: new Buffer([13, 37]).toString('base64')
                }),
                step
            )
        })

        it('turns an JSON string into a populated Step object', function () {
            let step = new Step(0, ['commandName'], new Buffer([13, 37]));

            let restoredStep =

            assert.deepEqual(
                Step.fromJSON(JSON.stringify({
                    stepId: 0,
                    commands: ['commandName'],
                    image: new Buffer([13, 37]).toString('base64')
                })),
                step
            )
        })

        it('restores object generated by #stepToJSON', function () {
            let step = new Step(0, ['commandName'], new Buffer([13, 37]));

            assert.deepEqual(
                Step.fromJSON(step.toJSON()),
                step
            )
        })
    })
})