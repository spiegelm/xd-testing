"use strict";

class AddressOptions {

    /**
     *
     * @param {boolean} [implicit]
     * @param {boolean} [any]
     */
    constructor(implicit, any) {

        /**
         * @type boolean
         */
        this.implicit = implicit || false

        /**
         * @type boolean
         */
        this.any = any || false
    }

    toString() {
        return "{" + Object.keys(this).map(key => key + ": " + this[key]).join(", ") + "}"
    }
}

module.exports = AddressOptions
