"use strict"

module.exports.injectEventLogger = function() {

    var DEBUG = false;

    function EventLogger() {
        this.eventNames = ["XDdisconnection", "XDconnection", "XDdevice", "XDroles", "XDsync", "XDserverReady", "XDothersRolesChanged"];
        this.eventCounter = {};

        this.eventNames.forEach((function (event) {
            this.eventCounter[event] = 0;
            XDmvc.on(event, (function (sender) {
                this.eventCounter[event]++;
                if (DEBUG) {
                    console.log(event);
                    console.log(sender);
                    console.log(this.eventCounter);
                }
            }).bind(this))
        }).bind(this));
    }

    window.eventLogger = new EventLogger();
    return 0;
};

module.exports.getEventCounter = function() {
    return window.eventLogger.eventCounter;
};

