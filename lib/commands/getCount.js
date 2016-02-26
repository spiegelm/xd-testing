"use strict";

/**
 *
 */

var q = require('q')

module.exports = (multiDevice) => {
    return function getCount() {
        var self = this,
            defer = q.defer();

        defer.resolve(Object.keys(multiDevice.instances).length);

        return defer.promise;
    }
};
