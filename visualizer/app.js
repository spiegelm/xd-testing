#!/usr/bin/env node
"use strict"

var q = require('q')
var fs = require('fs')
var fsp = require('fs-promise')
var path = require('path')
var Flow = require('./../lib/flow/flow')
var Mustache = require('mustache')

var express = require('express')
var app = express()

app.get('/', function (req, res) {
    const FLOW_DIRECTORY = path.join(process.cwd(), 'flows');

    // Read files from query
    let selectedFiles = req.query['files'] || []
    // Make absolute file names
    let absoluteFileNames = selectedFiles.map(file => path.join(FLOW_DIRECTORY, file) )


    let allFiles = fs.readdirSync(FLOW_DIRECTORY)
        .filter(filename => fs.statSync(path.join(FLOW_DIRECTORY, filename)).isFile() && path.extname(filename) == '.json')

    console.log('files:', selectedFiles)

    // Load templates
    let template = fs.readFileSync(path.join(__dirname, 'views/layout.mustache'), 'utf-8')
    let partials = {
        'flow_selection': fs.readFileSync(path.join(__dirname, 'views/selection.mustache'), 'utf-8'),
        'checkpoint_selection': fs.readFileSync(path.join(__dirname, 'views/checkpoint_selection.mustache'), 'utf-8')
    }

    let view = {
        'file': selectedFiles[0],
        'allFiles': allFiles,
        'flowDirectory': FLOW_DIRECTORY,
        'messages': [],
        'flows': [],
        'checkpoints': [],
        'json': function() {
            return function(json, render) {
                return "JSON: " + render(json)
            }
        },
        'img': function() {
            return function(value, render) {
                let rendered = render(value) + ""
                let length = rendered.length
                return length > 0 ? ('<img src="data:image/png;base64,' + rendered + '">') : ''
            }
        },
        'device-icon': function() {
            let iconType = {
                'phone': 'mobile',
                'tablet': 'tablet',
                'desktop': 'desktop'
            }
            let faType = iconType[this.type]
            let screenSize = null
            if (this.width && this.height) {
                screenSize = this.width + "x" + this.height
            }

            if (faType) {
                let capitalizeFirstLetter = string => string[0].toUpperCase() + string.slice(1)
                let title = Mustache.render("{{type}}{{#screenSize}}, {{.}}{{/screenSize}}", {
                    'type': capitalizeFirstLetter(faType),
                    'screenSize': screenSize
                })
                return '<i class="fa fa-' + faType + '" aria-hidden="true" title="' + title + '"></i>'
            } else {
                return ''
            }
        }
    }

    q.all(absoluteFileNames.map(fileName => fsp.access(fileName, fs.F_OK)
        .catch(err => {
            let message = "Error loading file. " + (err.path || "")
            console.log(message)
            view.messages.push(message)
            res.status(404)
        })
        .then(() => {
            let flow = Flow.load(fileName)

            view.flows.push({
                devices: flow.deviceArray(),
                grid: flow.grid()
            })

            view.checkpoints = view.checkpoints.concat(flow.checkpoints().map(c => c.name))
        })
    )).then(() => {
        view.checkpoints = view.checkpoints.filter((value, index, self) => {
            // Is the first value in the array
            return self.indexOf(value) === index
        })
        console.log('view.checkpoints', view.checkpoints)

        // Render template
        let html = Mustache.render(template, view, partials)

        res.send(html)
    }).catch(err => {
        let message = "An error occured. " + err.message
        console.log(message)
        view.messages.push(message)
        res.status(500)
    })
});

app.use('/public', express.static(path.join(__dirname, '/public')))
app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')))

app.listen(3000, function () {
    console.log('Listening on port 3000.')
})
