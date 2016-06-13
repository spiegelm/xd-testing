"use strict";

function scrollToCheckpoint(checkpointName) {
    var xpathCheckpoints = '//*[@class="checkpoint-name" and .//text()="' + checkpointName + '"]'
    var elements = document.evaluate(xpathCheckpoints, document, null, XPathResult.ANY_TYPE, null)

    var checkpoint = elements.iterateNext()
    while (checkpoint) {
        checkpoint.scrollIntoView();
        $(checkpoint).closest('.checkpoint-row').effect('highlight', {}, 1000)
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
    var updateView = function() {
        var checked = $('input#show-commands')[0].checked
        showCommands(checked)
    }
    $('input#show-commands').on('change', function() {
        updateView()
    })
    updateView()
})
