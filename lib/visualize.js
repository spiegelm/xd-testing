#!/usr/bin/env node
"use strict";

var fs = require('fs'),
    path = require('path'),
    StepStorage = require('./stepStorage');
var Mustache = require('mustache');
var cli = require('yargs')
    .usage('Usage: $0 [options]')
    .version(function() {
        var pack = require('../package');
        return pack.name + " " + pack.version;
    })
    .strict()
    .help('help')
var argv = cli.argv

const STEPS_FILE = path.join(process.cwd(), StepStorage.FILE);
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

console.log(STEPS_FILE);

fs.access(STEPS_FILE, fs.F_OK, function(err) {
    let storage = (new StepStorage()).load();

    // Generate images
    let file = 'flow.html';

    let args = analyzeSteps(storage.steps);

    let template = fs.readFileSync('flow_template.mustache', 'utf-8');
    let html = Mustache.render(template, args);

    fs.writeFileSync(file, html);
    console.log("Wrote file to " + file);
});

/**
 * @param {Step[]} steps
 */
function analyzeSteps(steps) {
    let devices = steps.reduce(function(previous, current) {
        previous[current.deviceId] = current.deviceId;
        return previous;
    }, {});

    return {
        'devices': Object.keys(devices),
        'steps': steps
    };
}