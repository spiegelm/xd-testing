#!/usr/bin/env node
"use strict";

var fs = require('fs'),
    path = require('path'),
    Flow = require('./flow/flow');
var Mustache = require('mustache');

var express = require('express');
var app = express();

app.get('/', function (req, res) {
    let file = req.query['file'] || null;
    if (!file) {
        // Explicitly redirect to default file
        res.redirect('/?file=' + Flow.FILE);
        return;
    }
    const STEPS_FILE = path.join(process.cwd(), file);

    console.log(STEPS_FILE);

    fs.access(STEPS_FILE, fs.F_OK, function(err) {
        if (err) {
            res.status(404).send("No such file. " + err.path || "");
            return;
        }

        // Load flow
        let flow = Flow.load(file);

        // Load template
        let template = fs.readFileSync('flow_template.mustache', 'utf-8');

        //let flow = flow.fixCommandAlignment().compressSteps();


        let args = {
            'devices': flow.deviceArray(),
            'checkpoints': flow.checkpoints(),
            'grid': flow.grid(),
            'json': function() {
                return function(json, render) {
                    return "JSON: " + render(json)
                }
            },
            'img': function() {
                return function(value, render) {
                    let rendered = render(value)
                    let length = (render(value) + "").length
                    return length > 0 ? ('<img src="data:image/png;base64,' + render(value) + '">') : ''
                }
            }
        };

        // Render template
        let html = Mustache.render(template, args);

        //let file = 'flow.html';
        //fs.writeFileSync(file, html);
        //console.log("Wrote file to " + file);

        res.send(html);
    });
});

app.use('/static', express.static(path.join(__dirname, '/../static')));
app.use('/bower_components', express.static(path.join(__dirname, '/../bower_components')));

//app.use(errorHandler())

app.listen(3000, function () {
    console.log('Listening on port 3000.');
});

