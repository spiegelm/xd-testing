"use strict"

/**
 * @type {Chai.Assert}
 */
var assert = require('chai').assert
var templates = require('../lib/templates')
var CommandAnalyzer = require('../lib/commandAnalyzer')
var q = require('q')

describe('CommandAnalyzer @small', () => {
    describe('.acceptsElementSelector', () => {
        it('is true for commands with optional or required element selector as first argument', () => {
            let elementSelectorCommands = CommandAnalyzer.getElementSelectorCommands()
            elementSelectorCommands.forEach(commandName => {
                let command = new CommandAnalyzer(commandName, [])
                assert.isTrue(command.acceptsElementSelector())
            })
        })
    })

    describe('element selector commands', function () {
        it('either accept an optional, a required, two required, or an array of selectors', () => {
            CommandAnalyzer.getElementSelectorCommands().forEach(commandName => {
                let command = new CommandAnalyzer(commandName, [])
                let count = 0
                count += command.acceptsOptionalElementSelector()
                count += command.requiresOneElementSelector()
                count += command.requiresTwoElementSelectors()
                count += command.requiresOneElementOrArraySelector()
                assert.equal(count, 1, 'Failed for command ' + commandName)
            })
        })

        it('are part of at least one category', function () {
            let commands = CommandAnalyzer.getElementSelectorCommands()
            let missingCommands = CommandAnalyzer.getAllElementSelectorCommands().filter(commandName => {
                return commands.indexOf(commandName) === -1
            })
            if (missingCommands) {
                console.log('missing commands:')
                missingCommands.forEach(commandName => console.log(commandName))
            }
            this.skip()
            // TODO ensure all element related commands are covered
            assert.lengthOf(missingCommands, 0, "Missing commands")
        })
    })
})
