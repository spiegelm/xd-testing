#!/usr/bin/env node
"use strict"

var fs = require('fs')
var path = require('path')
var Flow = require('./../lib/flow/flow')
var Mustache = require('mustache')

var express = require('express')
var app = express()

app.get('/', function (req, res) {
    let file = req.query['file'] || null
    if (!file) {
        // Explicitly redirect to default file
        res.redirect('/?file=' + Flow.FILE)
        return
    }
    const STEPS_FILE = path.join(process.cwd(), file)

    console.log(STEPS_FILE)

    fs.access(STEPS_FILE, fs.F_OK, function(err) {
        // Load templates
        let template = fs.readFileSync(path.join(__dirname, 'views/layout.mustache'), 'utf-8')
        let partials = {
            'flow_selection': fs.readFileSync(path.join(__dirname, 'views/selection.mustache'), 'utf-8')
        }

        let view = {
            'messages': [],
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


        if (err) {
            view.messages.push("No such file. " + (err.path || ""))
            res.status(404)
        } else {
            // Load flow
            let flow = Flow.load(file)


            Object.assign(view, {
                'devices': flow.deviceArray(),
                'grid': flow.grid()
            })
        }

        // Render template
        let html = Mustache.render(template, view, partials)

        //let file = 'flow.html';
        //fs.writeFileSync(file, html);
        //console.log("Wrote file to " + file);

        res.send(html)
    });
});

app.use('/public', express.static(path.join(__dirname, '/public')))
app.use('/bower_components', express.static(path.join(__dirname, '/../bower_components')))

//app.use(errorHandler())

app.listen(3000, function () {
    console.log('Listening on port 3000.')
})

