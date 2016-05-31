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
