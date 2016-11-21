"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
var FrameArray = (function (_super) {
    __extends(FrameArray, _super);
    function FrameArray(data) {
        _super.call(this);
        this.data = data;
    }
    FrameArray.prototype.at = function (index) {
        return this.data[index];
    };
    return FrameArray;
}(Frame));
exports.FrameArray = FrameArray;
