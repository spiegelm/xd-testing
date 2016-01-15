"use strict";

var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var clientA = webdriverio.remote(options);
var clientB = webdriverio.remote(options);


var baseUrl = "http://me.local:8082/gallery.html";

var browserA = clientA.init()
    .windowHandleSize({width: 800, height: 800})
    .windowHandlePosition({x: 0, y: 0});
var browserB = clientB.init()
    .windowHandleSize({width: 800, height: 800})
    .windowHandlePosition({x: 800, y: 0});

var imageUrlA;

browserA.url(baseUrl).then(function() {
    console.log('A: initialized');
    // Wait until application is loaded

}).getUrl().then(function(url) {
    console.log('A: url ' + url);
    browserB.url(url).then(function() {
        console.log('B: initialized');
    });
}).waitForVisible('h2.gallery-overview').then(function() {
    console.log('A: h2.gallery-overview is visible');
}).click('//*[text()="Bike Tours"]').then(function() {
    console.log('A: clicked Bike Tours');
}).pause(3000).then(function() {
    console.log('A: waited for 3000ms');
}).waitForVisible('#gallery img:nth-of-type(1)').then(function() {
    console.log('A: first image is visible');
}) .click('#gallery img:nth-of-type(1)').then(function() {
    console.log('A: clicked first image in galery');
}).waitForVisible('#image img').then(function() {
    console.log('A: #image img is visible');
}).getAttribute('#image img', 'src').then(function(src) {
    imageUrlA = src;
    console.log('A: image src ' + src);
}).getUrl().then(function(url) {
    browserB.url(url).then(function() {
        console.log('B: loaded ' + url);
    }).waitForExist('#image img').then(function() {
        console.log('B: image found');
    }).pause(3000).then(function() {
        console.log('B: waited for 3000ms');
    }).getAttribute('#image img', 'src').then(function(src) {
            console.log('B: img src ' + src);
            console.log('A: imageUrlA ' + imageUrlA);
            if (src == imageUrlA) {
                console.log('images are equal!');
            } else {
                console.log('ERROR! different images.');
            }
    }).endAll();
});
