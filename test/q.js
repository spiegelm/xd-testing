"use strict";

var q = require('q');

describe('q', function() {
    it('x', function() {
        var defer = q.defer();
        defer.resolve(15);
        defer.promise.then(x => assert.equals(x, 15));
    })

    it('x', function() {
        var defer = q.defer();
        defer.resolve(15);
        defer.promise.then(x => assert.equals(x, 15))
        .then();
    })
});
