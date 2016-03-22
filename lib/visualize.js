#!/usr/bin/env node
"use strict";

var fs = require('fs'),
    path = require('path'),
    Flow = require('./flow');
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

const STEPS_FILE = path.join(process.cwd(), Flow.FILE);
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

console.log(STEPS_FILE);

fs.access(STEPS_FILE, fs.F_OK, function(err) {
    let flow = (new Flow()).load();

    // Generate images
    let file = 'flow.html';

    let args = analyzeSteps(flow.compressSteps().steps);

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

    // Add base64 encoding
    steps.forEach(step => step.imageBase64 = step.image.toString('base64'))

    return {
        'devices': Object.keys(devices),
        'steps': steps
    };
}