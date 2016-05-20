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
    twoElementSelectorCommands: ['dragAndDrop'],

    /**
     * @todo decide what to do with this commands
     */
    //todo: ['isEnabled', 'isExisting', 'isSelected', 'isVisible', 'isVisibleWithinViewport', 'waitForEnabled',
    //    'waitForExist', 'waitForSelected', 'waitForText', 'waitForValue', 'waitForVisible']
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

let allElementSelectorCommands = ['addValue', 'chooseFile', 'clearElement', 'click', 'doubleClick', 'dragAndDrop',
    'flick', 'flickDown', 'flickLeft', 'flickRight', 'flickUp', 'getAttribute', 'getCssProperty', 'getElementSize',
    'getHTML', 'getLocation', 'getLocationInView', 'getTagName', 'getText', 'getValue', 'hold', 'isEnabled',
    'isExisting', 'isSelected', 'isVisible', 'isVisibleWithinViewport', 'leftClick', 'middleClick', 'moveToObject',
    'release', 'rightClick', 'scroll', 'selectorExecute', 'selectorExecuteAsync', 'setValue', 'submitForm', 'touch',
    'waitForEnabled', 'waitForExist', 'waitForSelected', 'waitForText', 'waitForValue', 'waitForVisible', 'element',
    'elementIdElement', 'elementIdElements', 'elements']

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
     * @returns {string[]}
     */
    static getElementSelectorCommands() {
        return elementSelectorCommands
    }

    /**
     * For testing purposes only. Used to verify all commands are in at least one category.
     * @access private
     * @returns {string[]}
     */
    static getAllElementSelectorCommands() {
        return allElementSelectorCommands
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
