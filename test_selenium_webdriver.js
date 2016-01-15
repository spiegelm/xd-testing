"use strict";

console.log('Custom test: Selenium Server + Selenium Webdriver JS Client');
console.log('-----------------------------------------------------------');



var webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;

var chrome = require('selenium-webdriver/chrome');
var path = require('chromedriver').path;

var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

var driverA = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();
var driverB = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

driverA.manage().window().setSize(800, 800);
driverA.manage().window().setPosition(0, 0);
driverB.manage().window().setSize(800, 800);
driverB.manage().window().setPosition(800, 0);


var baseUrl = "http://me.local:8082/gallery.html";

// TODO: Look at pseudo parallel flows: webdriver.promise.createFlow()
driverA.get(baseUrl).then(function () {
    console.log('A: initialized');

    driverA.getCurrentUrl().then(function(url) {
        console.log('A: url ' + url);
        driverB.get(url).then(function () {
            console.log('B: url ' + url);
        });
    });
});

driverA.sleep(3000).then(function() {
//driverA.wait(until.elementIsVisible(By.css('h2.gallery-overview'))).then(function() {
// TypeError: element.isDisplayed is not a function
    console.log('A: waited for 3000ms ("h2.gallery-overview is visible")');
});
driverA.findElement(By.xpath('//*[text()="Bike Tours"]')).click().then(function() {
    console.log('A: clicked Bike Tours');
});
driverA.sleep(3000).then(function() {
    console.log('A: waited for 3000ms ("first image is visible")');
});
//}).waitForVisible('#gallery img:nth-of-type(1)').then(function() {
//    console.log('A: first image is visible');
driverA.findElement(By.css('#gallery img:nth-of-type(1)')).click().then(function() {
    console.log('A: clicked first image in galery');
});
driverA.sleep(3000).then(function() {
    console.log('A: waited for 3000ms ("#image img is visible")');
});
//driverA.waitForVisible('#image img').then(function() {
//    console.log('A: #image img is visible');
//});

var imageUrlA;
driverA.findElement(By.css('#image img')).getAttribute('src').then(function(src) {
    imageUrlA = src;
    console.log('A: image src ' + src);
});
driverA.getCurrentUrl().then(function(url) {
    driverB.getCurrentUrl().then(function(url) {
        console.log('B: loaded ' + url);
    });
    driverB.sleep(3000).then(function() {
        console.log('B: waited for 3000ms ("image found")');
    });
    //waitForExist('#image img').then(function() {
    //    console.log('B: image found');

    driverB.findElement(By.css('#image img')).getAttribute('src').then(function(src) {
        console.log('A: imageUrlA ' + imageUrlA);
        console.log('B: image src ' + src);
        if (src == imageUrlA) {
            console.log('SUCCESS, images are equal!');
        } else {
            console.log('ERROR! different images.');
        }
    });
});

driverA.quit();
driverB.quit();

