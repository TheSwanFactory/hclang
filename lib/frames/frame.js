"use strict";
var Frame = (function () {
    function Frame() {
    }
    Frame.prototype.call = function (argument) {
        return argument;
    };
    return Frame;
}());
exports.Frame = Frame;
;
var FrameArray = (function () {
    function FrameArray(data) {
        this.data = data;
    }
    FrameArray.prototype.at = function (index) {
        return this.data[index];
    };
    return FrameArray;
}());
exports.FrameArray = FrameArray;
