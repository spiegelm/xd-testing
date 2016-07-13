#!/usr/bin/env node
"use strict"

var templates = require('./templates')
var fs = require('fs')
var path = require('path')
var groupNameDeviceScenarios = 'Device scenario options:'
var yargs = require('yargs')


const CONFIG_FILE = 'xd-testing.json'
const CONFIG_FILE_PATH = path.join(process.cwd(), CONFIG_FILE)

var cli = yargs
    .usage("Usage: $0 [options]\n\n" +
        "Generate multiple device scenarios with 2^n + 1 random devices per scenario,\n" +
        "e.g. 2, 3, 5, 9, etc. The scenarios are written to the file \"" + CONFIG_FILE + "\".\n" +
        "Use the options to constrain the used devices.")
    .option('max', {
        group: groupNameDeviceScenarios,
        describe: 'Maximum number of generated devices per scenario',
        default: 5
    })
    .option('t', {
        array: true,
        alias: 'type',
        group: groupNameDeviceScenarios,
        describe: 'Use device type',
        choices: templates.types
    })
    .option('s', {
        array: true,
        alias: 'size',
        group: groupNameDeviceScenarios,
        describe: 'Use device size',
        choices: templates.sizes
    })
    .option('d', {
        array: true,
        alias: 'device',
        group: groupNameDeviceScenarios,
        describe: 'Use device',
        choices: Object.keys(templates.devices)
    })
    .option('f', {
        boolean: true,
        alias: 'force',
        describe: 'Override existing config file'
    })
    .option('n', {
        boolean: true,
        alias: 'dry-run',
        describe: 'Don\'t write the generated config to disk'
    })
    .version(function() {
        var pack = require('../package');
        return pack.name + " " + pack.version;
    })
    .strict()
    .help('help')
var argv = cli.argv

fs.access(CONFIG_FILE_PATH, fs.F_OK, function(err) {
    var exclusiveCount = 0;
    exclusiveCount += (!!argv.type) ? 1 : 0;
    exclusiveCount += (!!argv.size) ? 1 : 0;
    exclusiveCount += (!!argv.device) ? 1 : 0;
    if (exclusiveCount > 1) {
        console.log("Mixing the options --type, --size, --device is not supported.")
        process.exit(1);
    }

    var dryRun = !!argv['dry-run']
    var force = !!argv['force']
    if (dryRun && force) {
        console.log("Provide either --dry-run OR --force.");
        process.exit(1);
    }

    var fileExists = !err; // File isn't accessible, so write a new one
    var writeFile = !dryRun && (!fileExists || force);

    if (!writeFile && !dryRun) {
        console.log("There is already a file " + CONFIG_FILE_PATH);
        process.exit(1);
    } else {
        // Generate config

        // For each setup use 2^n + 1 devices: 2, 3, 5, 9, ...
        var setups = []
        var deviceIndices = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'
        for (let t = 1; t < argv.max; t *= 2) {
            var devices = {}
            for (let i = 0; i <= t; i++) {
                var device;
                if (argv.type) {
                    var types = argv.type || templates.types
                    if (!(types instanceof Array)) { types = [types] }
                    device = templates.random.randomOfTypes(types)
                } else if(argv.size) {
                    var sizes = argv.size || templates.sizes
                    if (!(sizes instanceof Array)) { sizes = [sizes] }
                    device = templates.random.randomOfSizes(sizes)
                } else {
                    // Specific devices or default
                    var chosenDevices = argv.device || Object.keys(templates.devices)
                    if (!(chosenDevices instanceof Array)) { chosenDevices = [chosenDevices] }
                    device = templates.random.randomOfDevices(chosenDevices)
                }
                devices[deviceIndices[i]] = device;
            }
            setups.push({devices: devices})
        }
        var config = {scenarios: setups}

        var json = JSON.stringify(config, null, 2)

        if (writeFile) {
            fs.writeFile(CONFIG_FILE_PATH, json, err => {
                if (err) throw err
                console.log("Wrote config file to " + CONFIG_FILE_PATH)
                console.log(json)
            })
        } else if (dryRun) {
            console.log("Would write config file to " + CONFIG_FILE_PATH)
            console.log(json)
        }
    }
})
