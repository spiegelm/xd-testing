"use strict";

var fs = require('fs'),
    path = require('path')

const CONFIG_FILE = path.join(process.cwd(), '/xd-testing.json');

fs.access(CONFIG_FILE, fs.F_OK, function(err) {
    if (!err) {
        console.log("There is already a file " + CONFIG_FILE);
    } else {
        // It isn't accessible
        var defaultConfig = {
            "setups": [
                {
                    "devices": {
                        "A": "chrome",
                        "B": "nexus4"
                    }
                },
                {
                    "devices": {
                        "A": "chrome",
                        "B": "nexus4",
                        "C": "nexus4"
                    }
                },
                {
                    "devices": {
                        "A": "chrome",
                        "B": "nexus4",
                        "C": "nexus4",
                        "D": "nexus4",
                        "E": "nexus4"
                    }
                }
            ]
        };

        fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig), err => {
            if (err) throw err;
            console.log("Wrote default config file to " + CONFIG_FILE);
        });
    }
});
