"use strict";

/**
 * @type Chai.Assert
 */
var assert = require('chai').assert
var fs = require('fs')
var Flow = require('../../lib/flow/flow')
var path = require('path')
var Mustache = require('mustache');

describe('Visualization @small', function () {

    describe('prerequisites', function () {
        it('Mustache iterates over array', function() {
            let template = "{{#array}}{{.}}{{/array}}"
            let args = {array: [1, 2]}
            let rendered = Mustache.render(template, args)
            assert.equal("12", rendered)
        })

        it('Mustache iterates over grid', function() {
            let template = "{{#grid}}{{#.}}{{name}}{{/.}}{{/grid}}"
            let args = {grid: [
                {name:'load',checkpoints:{0:{name:'name'}, 1:{name:'name'}}},
                {name:'click',checkpoints:{0:{name:'name'}, 1:{name:'name'}}}
            ]}
            let rendered = Mustache.render(template, args)
            assert.equal("loadclick", rendered)
        })
    })
})
