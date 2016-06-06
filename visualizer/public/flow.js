"use strict";

function scrollToCheckpoint(checkpointName) {
    var xpathCheckpoints = '//*[@class="checkpoint-name" and .//text()="' + checkpointName + '"]'
    var elements = document.evaluate(xpathCheckpoints, document, null, XPathResult.ANY_TYPE, null)

    var checkpoint = elements.iterateNext()
    while (checkpoint) {
        checkpoint.scrollIntoView();
        checkpoint = elements.iterateNext()
    }
}

function showCommands(visiblity) {
    if (visiblity) {
        $('.step .command').show()
    } else {
        $('.step .command').hide()
    }
}

$(function () {
    var input = $('input#show-commands')
    input.on('change', function () {
        showCommands(this.checked)
    })
})
