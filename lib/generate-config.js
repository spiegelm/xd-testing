#!/usr/bin/env node
"use strict"

var templates = require('./templates')
var fs = require('fs')
var path = require('path')
var cli = require('yargs')
    .usage('Usage: $0 [options]')
    .option('max', {
        describe: 'Maximum number of generated devices',
        default: 5
    })
    .option('t', {
        alias: 'type',
        describe: 'Use device type',
        choices: templates.types
    })
    .option('s', {
        alias: 'size',
        describe: 'Use device size',
        choices: templates.sizes
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
    .help('help')
var argv = cli.argv

const CONFIG_FILE = path.join(process.cwd(), '/xd-testing.json')

fs.access(CONFIG_FILE, fs.F_OK, function(err) {

    if (argv.type && argv.size) {
        console.error("You cannot use both type and size options.")
        process.exit(1);
    }

    var dryRun = !!argv['dry-run'];
    var fileExists = !err; // File isn't accessible, so write a new one
    var writeFile = !dryRun && (!fileExists || argv.force);

    if (!writeFile && !dryRun) {
        console.log("There is already a file " + CONFIG_FILE);
        process.exit(1);
    } else {
        // Generate config


        var types = argv.type || templates.types
        var sizes = argv.size || templates.sizes
        if (!(types instanceof Array)) {
            types = [types];
        }
        if (!(sizes instanceof Array)) {
            sizes = [sizes];
        }

        // For each setup use 2^n + 1 devices
        var setups = []
        var deviceIndices = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'
        for (let t = 1; t < argv.max; t *= 2) {
            var devices = {}
            for (let i = 0; i <= t; i++) {
                var device;
                device = argv.type ? templates.random.randomOfTypes(types) : templates.random.randomOfSizes(sizes);
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
