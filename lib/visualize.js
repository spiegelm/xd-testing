#!/usr/bin/env node
"use strict";

var fs = require('fs'),
    path = require('path'),
    Flow = require('./flow');
var Mustache = require('mustache');

var express = require('express');
var app = express();

app.get('/', function (req, res) {
    let file = req.param('file', null);
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
        let flow = (new Flow()).load(file);

        // Load template
        let template = fs.readFileSync('flow_template.mustache', 'utf-8');

        let compressedFlow = flow.fixCommandAlignment().compressSteps();

        // Add base64 encoded image
        let steps = compressedFlow.steps;
        steps.forEach(step => step.imageBase64 = step.image.toString('base64'))

        let args = {
            'devices': compressedFlow.devices(),
            'deviceSteps': compressedFlow.devices().map(deviceId => {
                return {deviceId: deviceId, steps: compressedFlow.deviceSteps(deviceId)}
            }),
            'steps': steps
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

