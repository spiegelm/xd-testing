"use strict"

let elementSelectorCategories = {
    /**
     * Require a element selector string as first argument
     */
    elementSelectorCommands: ['addValue', 'chooseFile', 'clearElement', 'click', 'doubleClick', 'getAttribute',
        'getCssProperty', 'getElementSize', 'getHTML', 'getLocation', 'getLocationInView', 'getTagName', 'getText',
        'getValue', 'hold', 'moveToObject', 'release', 'setValue',
        'submitForm', 'touch', 'flickDown', 'flickLeft', 'flickRight', 'flickUp'],

    /**
     * Require a element selector string as first argument
     */
    elementSelectorProtocols: ['element', 'elementIdElement', 'elementIdElements', 'elements'],

    /**
     * Require one element selector or an array of element selectors
     */
    elementSelectorArrayCommands: ['selectorExecute', 'selectorExecuteAsync'],

    /**
     * Accept but don't require an element selector
     */
    optionalElementSelectorCommands: ['flick', 'scroll', 'leftClick', 'middleClick', 'rightClick'],

    /**
     * Require two element selectors as the first two arguments
     */
    twoElementSelectorCommands: ['dragAndDrop']
}
/**
 * Require a element selector string as first argument
 * @type {Array.<string>}
 */
let oneElementSelector = elementSelectorCategories.elementSelectorCommands.concat(elementSelectorCategories.elementSelectorProtocols)

// Merge all implicit command categories
let elementSelectorCommands = Object.keys(elementSelectorCategories).map(key => elementSelectorCategories[key]).reduce(
    (previous, current) => previous.concat(current), []
)

class CommandAnalyzer {

    /**
     * @param {string} name
     * @param {Object[]} args
     */
    constructor(name, args) {

        /**
         * @type {string}
         */
        this.name = name

        /**
         * @type {Object[]}
         */
        this.arguments = args

        /**
         * @type {Object|string}
         */
        this.selector = this.arguments[0]
    }

    /**
     * @returns {Array.<string>}
     */
    static getElementSelectorCommands() {
        return elementSelectorCommands
    }

    /**
     * @returns {boolean} True if the selector argument has the correct type or of the selector is optional.
     */
    hasSelectorArgument() {
        if (typeof this.selector !== "string") {
            if (this.acceptsOptionalElementSelector()) {
                // Optional selector is not given
                return false
            } else {
                // Element selector is required (not optional) and of wrong type
                throw new Error('selector needs to be typeof "string"', 'ImplicitDeviceSelectionError')
            }
        }
        return true
    }

    /**
     * @returns {boolean} True if a element selector is accepted - but may not required.
     */
    acceptsElementSelector() {
        return elementSelectorCommands.indexOf(this.name) !== -1
    }

    /**
     * @returns {boolean} True if a element selector is optionally accepted - but not required.
     */
    acceptsOptionalElementSelector() {
        return elementSelectorCategories.optionalElementSelectorCommands.indexOf(this.name) !== -1
    }

    /**
     * @returns {boolean} True if exactly one element selector is required as first argument.
     */
    requiresOneElementSelector() {
        return oneElementSelector.indexOf(this.name) !== -1
    }

    /**
     * @returns {boolean} True if two element selectors are required as the first two arguments.
     */
    requiresTwoElementSelectors() {
        return elementSelectorCategories.twoElementSelectorCommands.indexOf(this.name) !== -1
    }

    /**
     * @returns {boolean} True if one element selector or an array of element selectors is required.
     */
    requiresOneElementOrArraySelector() {
        return elementSelectorCategories.elementSelectorArrayCommands.indexOf(this.name) !== -1
    }
}

module.exports = CommandAnalyzer
