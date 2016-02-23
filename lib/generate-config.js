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
    .option('f', {
        boolean: true,
        alias: 'force',
        describe: 'Override existing config file'
    })
    .option('t', {
        alias: 'type',
        describe: 'Device types',
        default: 'phone',
        choices: templates.types
    })
    .version(function() {
        var pack = require('../package');
        return pack.name + " " + pack.version;
    })
    .help('help')
var argv = cli.argv

const CONFIG_FILE = path.join(process.cwd(), '/xd-testing.json')

fs.access(CONFIG_FILE, fs.F_OK, function(err) {
    if (!err && !argv.force) {
        console.log("There is already a file " + CONFIG_FILE);
    } else {
        // File isn't accessible, so write a new one

        var types = argv.type
        if (!(types instanceof Array)) {
            types = [types];
        }

        // Generate config
        // For each setup use 2^n + 1 devices
        var setups = []
        var deviceIndices = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'
        for (let t = 1; t < argv.max; t *= 2) {
            var devices = {}
            for (let i = 0; i <= t; i++) {
                devices[deviceIndices[i]] = templates.random.randomOfTypes(types)
            }
            setups.push({devices: devices})
        }
        var config = {setups: setups}

        var json = JSON.stringify(config, null, 2)

        fs.writeFile(CONFIG_FILE, json, err => {
            if (err) throw err
            console.log("Wrote config file to " + CONFIG_FILE)
            console.log(json)
        })
    }
})
