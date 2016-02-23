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

        describe('.chrome()', function() {
            it('returns an Device object', function() {
                returnsADeviceObject(templates.devices, 'chrome')
            })
            it('.type is "desktop"', function() {
                assert.equal(templates.devices.chrome().type, 'desktop')
            })
        })
        describe('.nexus4()', function() {
            it('returns an Device object', () => { returnsADeviceObject(templates.devices, 'nexus4') })
        })
        describe('.nexus5()', function() {
            it('returns an Device object', () => { returnsADeviceObject(templates.devices, 'nexus5') })
        })
        describe('.nexus7()', function() {
            it('returns an Device object', () => { returnsADeviceObject(templates.devices, 'nexus7') })
        })
        describe('.nexus10()', function() {
            it('returns an Device object', () => { returnsADeviceObject(templates.devices, 'nexus10') })
        })
    })
})
