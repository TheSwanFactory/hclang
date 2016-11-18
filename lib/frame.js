"use strict";
var Frame = (function () {
    function Frame(message) {
        this.greeting = message;
    }
    Frame.prototype.greet = function () {
        return "Bonjour, " + this.greeting + "!";
    };
    return Frame;
}());
exports.Frame = Frame;
;
