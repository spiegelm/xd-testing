"use strict"

var fs = require('fs')
var path = require('path')
var argv = require('yargs')
    .usage('Usage: $0 [options]')
    .default('max', 5)
    .describe('max', 'Maximum number of generated devices')

    .boolean('force')
    .alias('f', 'force')
    .describe('force', 'Override existing config file')

    .help('help')
    .argv

const CONFIG_FILE = path.join(process.cwd(), '/xd-testing.json')

fs.access(CONFIG_FILE, fs.F_OK, function(err) {
    if (!err && !argv.force) {
        console.log("There is already a file " + CONFIG_FILE);
    } else {
         // File isn't accessible, so write a new one

        // Generate config
        // For each setup use one chrome device and a power of two nexus4 devices

        var setups = []
        var deviceIndices = 'BCDEFGHJKLMNOPQRSTUVWXYZ'
        for (let t = 1; t < argv.max; t *= 2) {
            var devices = {"A": "chrome"}
            for (let i = 0; i < t; i++) {
                devices[deviceIndices[i]] = "nexus4"
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
