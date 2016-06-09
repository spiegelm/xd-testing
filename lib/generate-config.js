#!/usr/bin/env node
"use strict"

var templates = require('./templates')
var fs = require('fs')
var path = require('path')
var groupNameDeviceSetup = 'Device setups:'
var cli = require('yargs')
    .usage('Usage: $0 [options]')
    .option('max', {
        group: groupNameDeviceSetup,
        describe: 'Maximum number of generated devices',
        default: 5
    })
    .option('t', {
        array: true,
        alias: 'type',
        group: groupNameDeviceSetup,
        describe: 'Use device type',
        choices: templates.types
    })
    .option('s', {
        array: true,
        alias: 'size',
        group: groupNameDeviceSetup,
        describe: 'Use device size',
        choices: templates.sizes
    })
    .option('d', {
        array: true,
        alias: 'device',
        group: groupNameDeviceSetup,
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

const CONFIG_FILE = path.join(process.cwd(), '/xd-testing.json')

fs.access(CONFIG_FILE, fs.F_OK, function(err) {
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
        console.log("There is already a file " + CONFIG_FILE);
        process.exit(1);
    } else {
        // Generate config

        // For each setup use 2^n + 1 devices
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
        var config = {setups: setups}

        var json = JSON.stringify(config, null, 2)

        if (writeFile) {
            fs.writeFile(CONFIG_FILE, json, err => {
                if (err) throw err
                console.log("Wrote config file to " + CONFIG_FILE)
                console.log(json)
            })
        } else if (dryRun) {
            console.log("Would write config file to " + CONFIG_FILE)
            console.log(json)
        }
    }
})
