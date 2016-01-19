"use strict";

console.log('Custom test: Selenium Server + WebdriverIO');
console.log('-----------------------------------------------------------');


var webdriverio = require('webdriverio');
var options = {desiredCapabilities: {browserName: 'chrome'}};
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

browserA.url(baseUrl).then(function () {
    console.log('A: initialized');
    // Wait until application is loaded

}).getUrl().then(function (url) {
    console.log('A: url ' + url);
    browserB.url(url).then(function () {
        console.log('B: url ' + url);
    });
}).waitForVisible('h2.gallery-overview').then(function () {
    console.log('A: h2.gallery-overview is visible');
}).click('//*[text()="Bike Tours"]').then(function () {
    console.log('A: clicked Bike Tours');
}).pause(3000).then(function () {
    console.log('A: waited for 3000ms');
}).waitForVisible('#gallery img:nth-of-type(1)').then(function () {
    console.log('A: first image is visible');
}).click('#gallery img:nth-of-type(1)').then(function () {
    console.log('A: clicked first image in galery');
}).waitForVisible('#image img').then(function () {
    console.log('A: #image img is visible');
}).scroll(0, 1000).then(function() {
    console.log('A: scrolled down to the end');
}).getAttribute('#image img', 'src').then(function (src) {
    imageUrlA = src;
    console.log('A: image src ' + src);
}).getUrl().then(function (url) {
    browserB.waitForVisible('#image img', 3000).then(function () {
        console.log('B: image found');
    }).pause(3000).then(function () {
        console.log('B: waited for 3000ms');
    }).getAttribute('#image img', 'src').then(function (src) {
        console.log('A: imageUrlA ' + imageUrlA);
        console.log('B: image src ' + src);
        if (src == imageUrlA) {
            console.log('SUCCESS, images are equal!');
        } else {
            console.log('ERROR! different images.');
        }
        browserA.saveScreenshot('./screenshots/browserA.png', function (err, screenshot, response) {
            console.log('A: save screenshot');
            console.log('err: ' + err);
        })
    }).saveScreenshot('./screenshots/browserB.png', function (err, screenshot, response) {
        console.log('B: save screenshot');
        console.log('err: ' + err);
    }).endAll();
});
