"use strict"

var xdTesting = require('./index')
var AddressOptions = require('./addressOptions')
var CommandAnalyzer = require('./commandAnalyzer')
var WebdriverIOMultiBrowser = require('webdriverio/lib/multibrowser')
var q = require('q')

/**
 * @constructor
 * @extends {Multibrowser}
 */
function MultiDevice(options) {
    // Call parent class constructor
    WebdriverIOMultiBrowser.call(this)

    /**
     * @type {Object.<string, Device>}
     */
    this.options = options
}

// Inherit from WebdriverIOMultiBrowser
MultiDevice.prototype = Object.create(WebdriverIOMultiBrowser.prototype)



/**
 * Modifier for multi instance.
 * @param {AddressOptions} [addressOptions]
 * @returns {Function} - Modify or add functionality for the given client
 * @override
 */
MultiDevice.prototype.getModifier = function (addressOptions) {

    var multiDevice = this
    var deviceIds = Object.keys(this.instances)

    addressOptions = addressOptions || new AddressOptions()

    return function (client) {
        // Call parent method.
        let parentModifier = WebdriverIOMultiBrowser.prototype.getModifier.call(multiDevice)
        client = parentModifier.call(multiDevice, client)

        // Add additional functionality

        // TODO add custom `select` return xdTesting.remote()

        var _next = client.next

        /**
         * Distribute commands to multiple device instances.
         * Used to select matching devices in implicit context.
         * Based on webdriverio/lib/multibrowser.js, getModifier(), client.next
         * @returns {Q.Promise}
         */
        client.next = function () {
            let self = this
            let promises = []
            let args = Array.prototype.slice.apply(arguments)
            let stack = args.pop()
            let fnName = args.pop()


            /**
             * no need for actual function here
             */
            args.shift()

            /**
             * flush promise bucket
             */
            multiDevice.promiseBucket = []

            return this.lastPromise.done(function () {

                let usedDeviceIds = []
                let intermediatePromise = null

                let fnArgs = args[0]

                // Intercept the command and execute it only on matching devices if:
                // - Command uses implicit device selection context
                // - Command uses element selector
                if (addressOptions.implicit || addressOptions.any) {
                    let command = new CommandAnalyzer(fnName, fnArgs)
                    let selector = command.selector

                    if (command.requiresTwoElementSelectors()) {
                        throw new Error('The command "' + fnName + '" with more than one element selectors is not ' +
                            'supported in implicit device selection context yet', 'ImplicitDeviceSelectionError')
                    }

                    if (command.acceptsElementSelector() && command.hasSelectorArgument()) {
                        // Determine matching devices, use promise for async call
                        intermediatePromise = q.all(deviceIds
                            .map(id => multiDevice.instances[id])
                            .map(device => device.isVisible(selector).then(visible => {
                                if (visible && !(addressOptions.any && usedDeviceIds.length)) {
                                    usedDeviceIds.push(device.options.id)
                                }
                            }))
                            .map(device => device.promise)
                        )
                    }
                }

                // Setup default values
                if (intermediatePromise === null) {
                    // Execute command on all devices per default
                    usedDeviceIds = deviceIds

                    // Create a promise and resolve it immediately
                    let intermediateDeferred = q.defer()
                    intermediatePromise = intermediateDeferred.promise
                    intermediateDeferred.resolve()
                }

                // After async device selection
                return intermediatePromise.then(() => {
                    // Apply command function and collect promises
                    usedDeviceIds.forEach(id => {
                        let device = multiDevice.instances[id]
                        device = device[fnName].apply(device, fnArgs)
                        promises.push(device.promise)
                    })

                    return q.all(promises).then(function (result) {
                        /**
                         * custom event handling since multibrowser instance
                         * actually never executes any command
                         */
                        var payload = {
                            fnName: fnName
                        }

                        for (var i = 0; i < deviceIds.length; ++i) {
                            payload[deviceIds[i]] = result[i]
                        }

                        if (fnName.match(/(init|end)/)) {
                            self.emit(fnName, payload)
                        }

                        self.emit('result', payload)
                        self.defer.resolve(result)
                    }, function (err) {
                        self.emit('error', err)
                        self.defer.reject(err)
                    })
                })
            })
        }


        /**
         * @callback DeviceCallback
         * @param {WebdriverIO.Client} device
         */

        /**
         * @callback DeviceIdsCallback
         * @return {number|number[]}
         */

        /**
         * @param {string[]|string|DeviceIdsCallback} ids - A single id or an array of ids; can also be a promise
         * @param {DeviceCallback} [callback] - receives the DeviceCollection as parameter
         * @param {AddressOptions} [newAddressOptions]
         */
        client.selectById = function selectById(ids, callback, newAddressOptions) {

            let returnSelection = typeof callback == 'undefined'

            // Throw TypeError on invalid parameter types
            if (!returnSelection && typeof callback !== 'function') {
                throw new TypeError("Invalid callback")
            }

            newAddressOptions = newAddressOptions || new AddressOptions()

            let newMultiDevice = null
            let newSelection = function () {
                // Resolve ids callback
                if (ids instanceof Function) {
                    ids = ids()
                }
                // Normalize ids to array
                if (!Array.isArray(ids)) {
                    ids = [ids]
                }

                let newOptions = {}
                newMultiDevice = new MultiDevice(newOptions)
                ids.forEach(id => {
                    let instance = multiDevice.instances[id]

                    if (!instance) {
                        throw new Error('browser "' + id + '" is not defined')
                    }

                    newMultiDevice.addInstance(id, instance)
                    newOptions[id] = multiDevice.options[id]
                })

                return xdTesting.remote(newOptions, newMultiDevice.getModifier(newAddressOptions), null)
            }

            if (returnSelection) {
                // Return selection instead of using the callback.
                // Wait for the currently issued commands before proceeding.
                return newSelection().then(() => {
                    return q.all(Object.keys(multiDevice.instances).map(id => multiDevice.instances[id]))
                })
            } else {
                // Use the new selection as the callback parameter
                return client.call(() => callback(newSelection()))
            }
        }

        /**
         * Wrap callback in implicit context and execute commands with element selectors only on matching devices.
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.implicit = function implicit(callback) {
            let ids = Object.keys(multiDevice.options)
            return client.selectById(ids, callback, new AddressOptions(true))
        }

        /**
         * Wrap callback in implicit context and execute commands with element selectors only on a single matching device.
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.any = function any(callback) {
            let ids = Object.keys(multiDevice.options)
            return client.selectById(ids, callback, new AddressOptions(true, true))
        }

        /**
         * @return {AddressOptions}
         */
        client.getAddressingOptions = function () {
            return this.then(() => addressOptions)
        }

        /**
         * @param {string[]|string} sizes - A single size or an array of sizes
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.selectBySize = function selectBySize(sizes, callback) {
            sizes = Array.isArray(sizes) ? sizes : [sizes]

            var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => sizes.indexOf(multiDevice.options[id].size) >= 0)

            return client.selectById(matchingInstanceIds, callback)
        }

        /**
         * @param {string[]|string} types - A single type or an array of types
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.selectByType = function selectByType(types, callback) {
            types = Array.isArray(types) ? types : [types]

            var matchingInstanceIds = Object.keys(multiDevice.instances).filter(id => types.indexOf(multiDevice.options[id].type) >= 0)

            return client.selectById(matchingInstanceIds, callback)
        }

        /**
         * Select all devices matching the selector parameter and execute the callback on them.
         * @param {string} selector - A css selector as used in WebdriverIO
         * @param {DeviceCallback} callback - receives the DeviceCollection as parameter
         */
        client.selectByElement = function selectByElement(selector, callback) {
            selector = selector || null

            let matchingInstanceIds = []

            return client
                .forEach(device => device
                    .elements(selector)
                    .then(response => {
                        if (response.value.length) {
                            matchingInstanceIds.push(device.options.id)
                        }
                    })
                )
                // Provide ids per callback, otherwise the array is read before it is filled
                .selectById(() => matchingInstanceIds, callback)
        }

        /**
         * Select any single device and execute the callback on it.
         * @param {DeviceCallback} callback - receives a single device as parameter
         */
        client.selectAny = function selectAny(callback) {
            let ids = []
            return client
                .forEach(device => ids.push(device.options.id))
                // Execute callback on the first device
                .selectById(() => ids[0], callback)
        }

        /**
         * @callback DeviceCallbackWithIndex
         * @param {WebdriverIO.Client} device
         * @param {number} index
         */

        /**
         * @param {DeviceCallbackWithIndex} callback
         */
        client.forEach = (callback) => {
            return client.call(function () {
                let usedInstanceKeys = Object.keys(multiDevice.instances)
                if (addressOptions.any) {
                    usedInstanceKeys = [usedInstanceKeys[0]]
                }
                return q.all(usedInstanceKeys.map(
                    (key, index) => callback(multiDevice.instances[key], index)
                ))
            })
        }

        /**
         * @returns {number}
         */
        client.getCount = () => {
            let count = 0

            return client.forEach(device => {
                count++
            }).then(() => {
                return count
            })
        }

        return client
    }
}

module.exports = MultiDevice
