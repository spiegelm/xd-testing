"use strict";

/**
 * @type Chai.Assert
 */
var assert = require('chai').assert;
var Flow = require('../lib/flow'),
    Step = require('../lib/step');


describe('Flow @small', function () {

    describe('#load', function () {
        it('should return the previously stored steps', function () {
            let step = new Step('A', 13, 'commandName', new Buffer([]));
            (new Flow()).addStep(step).store();

            let steps = (new Flow()).load().steps;

            assert.lengthOf(steps, 1);
            assert.deepEqual(steps, [step]);
        });

        it('should handle binary images', function () {
            let image = new Buffer([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 1, 19, 0, 0, 0, 111, 8, 2, 0, 0, 0, 64, 92, 179, 225, 0, 0, 1, 68, 73, 68, 65, 84, 120, 156, 237, 211, 193, 13, 192, 32, 16, 192, 176, 210, 253, 119, 62, 102, 32, 31, 132, 100, 79, 144, 79, 214, 204, 124, 192, 161, 255, 118, 0, 60, 201, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 133, 115, 160, 112, 14, 20, 206, 129, 194, 57, 80, 56, 7, 10, 231, 64, 225, 28, 40, 156, 3, 197, 6, 50, 25, 3, 219, 128, 104, 53, 250, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])
            let step = new Step('A', 13, 'commandName', image);
            (new Flow()).addStep(step).store();

            let steps = (new Flow()).load().steps;

            assert.lengthOf(steps, 1);
            assert.property(steps[0], 'image');
            assert.instanceOf(steps[0].image, Buffer);
            assert.isTrue(steps[0].image.equals(step.image));
        });
    })

    describe('#deviceSteps', function () {
        it('should return all steps with the given deviceId', function () {
            let step0 = new Step('A', 12, 'commandName', new Buffer([]));
            let step1 = new Step('B', 13, 'commandName', new Buffer([]));
            let step2 = new Step('A', 14, 'commandName', new Buffer([]));

            assert.deepEqual((new Flow()).addStep(step0).addStep(step1).addStep(step2).deviceSteps('A'), [step0, step2]);
        })

        it('should not return steps of other devices', function () {
            let step0 = new Step('A', 12, 'commandName', new Buffer([]));

            assert.deepEqual(
                (new Flow())
                    .addStep(step0)
                    .addStep(new Step('B', 13, 'commandName', new Buffer([])))
                    .addStep(new Step('C', 14, 'commandName', new Buffer([])))
                    .deviceSteps('A'),
                [step0]
            );
        })
    })

    describe('#devices', function () {
        it('should return a list of devices contained in the steps', function () {
            assert.deepEqual(
                (new Flow())
                    .addStep(new Step('A', 13, 'commandName', new Buffer([])))
                    .addStep(new Step('B', 14, 'commandName', new Buffer([])))
                    .addStep(new Step('C', 15, 'commandName', new Buffer([])))
                    .addStep(new Step('A', 13, 'commandName', new Buffer([])))
                    .addStep(new Step('B', 14, 'commandName', new Buffer([])))
                    .addStep(new Step('C', 15, 'commandName', new Buffer([])))
                    .devices(),
                ['A', 'B', 'C']
            );
        })
    })

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

        it('should merge consecutive steps with identical screen shots of the same device', function () {
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
    })
})

