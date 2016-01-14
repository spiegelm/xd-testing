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
//var driverB = new webdriver.Builder()
//    .withCapabilities(webdriver.Capabilities.chrome())
//    .build();

driverA.manage().window().setSize(800, 800);
driverA.manage().window().setPosition(0, 0);
//driverB.manage().window().setSize(800, 800);
//driverB.manage().window().setPosition(800, 0);

var test = function () {
    var baseUrl = "http://me.local:8082/gallery.html";

    driverA.get(baseUrl);
    // Wait until application is loaded
    driverA.wait(until.elementLocated(By.css('h2.gallery-overview')));

    //driverB.get(driverA.getCurrentUrl());

    console.log(new Error().lineNumber);
    driverA.findElement(By.xpath('//*[text()="Bike Tours"]')).click();
    console.log(new Error().lineNumber);

    driverA.wait(until.elementLocated(By.css('img:first-of-type')));
    console.log(new Error().lineNumber);
    var firstThumbnail = driverA.findElement(By.css('img:first-of-type'));
    firstThumbnail.click();
    console.log(new Error().lineNumber);

    //driverA.wait(until.elementLocated(By.css('#image img')));
    //var imageA = driverA.findElement(By.css('#image img'));
    //var imageSrcA = imageA.getAttribute('src');

    //
    //driverA.executeScript('debugger;');
    //driverB.executeScript('debugger;');
    //
    //var imageB = driverB.findElement(By.css('img'));
    //var imageSrcB = imageB.getAttribute('src');
    //
    //if (imageSrcA == imageSrcB) {
    //    console.log("Correct image is shown in browser B");
    //
    //    driverA.quit();
    //    driverB.quit();
    //
    //} else {
    //    console.log("Error. Incorrect image is shown in browser B");
    //}
    //

};

test();