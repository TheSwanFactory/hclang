"use strict";
var Frame = (function () {
    function Frame() {
    }
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
