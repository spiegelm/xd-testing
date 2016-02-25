"use strict"

var assert = require('chai').assert

var templates = require('../lib/templates')

function returnsADeviceObject(devices, name) {
    assert.property(devices, name);
    assert.isFunction(devices[name]);

    assert.property(devices[name](), 'name');
    assert.isString(templates.devices[name]().name);

    assert.property(devices[name](), 'type');
    assert.isString(devices[name]().type);

    assert.property(devices[name](), 'size');
    assert.isString(devices[name]().type);

    assert.property(devices[name](), 'width');
    assert.isNumber(devices[name]().width);

    assert.property(devices[name](), 'height');
    assert.isNumber(devices[name]().height);
}

describe('require("lib/template")', function() {
    describe('.devices', function() {
        var deviceFunction = name => templates.devices[name]

        describe('.chrome()', function() {
            var name = 'chrome'
            it('returns an Device object',function() { returnsADeviceObject(templates.devices, name) })
            it('.type is "desktop"', function() { assert.equal(deviceFunction(name)().type, 'desktop') })
        })
        describe('.nexus4()', function() {
            var name = 'nexus4'
            it('returns an Device object', () => { returnsADeviceObject(templates.devices, name) })
            it('.type is "phone"', function() { assert.equal(deviceFunction(name)().type, 'phone') })
        })
        describe('.nexus5()', function() {
            var name = 'nexus5'
            it('returns an Device object', () => { returnsADeviceObject(templates.devices, name) })
            it('.type is "phone"', function() { assert.equal(deviceFunction(name)().type, 'phone') })
        })
        describe('.nexus7()', function() {
            var name = 'nexus7'
            it('returns an Device object', () => { returnsADeviceObject(templates.devices, name) })
            it('.type is "tablet"', function() { assert.equal(deviceFunction(name)().type, 'tablet') })
        })
        describe('.nexus10()', function() {
            var name = 'nexus10'
            it('returns an Device object', () => { returnsADeviceObject(templates.devices, name) })
            it('.type is "tablet"', function() { assert.equal(deviceFunction(name)().type, 'tablet') })
        })
    })
})
