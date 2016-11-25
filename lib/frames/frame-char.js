"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameChar = (function (_super) {
    __extends(FrameChar, _super);
    function FrameChar(data) {
        _super.call(this);
        this.data = data;
    }
    FrameChar.for = function (char) {
        var exists = FrameChar.chars[char];
        return exists || (FrameChar.chars[char] = new FrameChar(char));
    };
    FrameChar.prototype.toStringData = function () {
        return this.data;
    };
    FrameChar.prototype.toString = function () {
        return "\\\\" + this.data.toString();
    };
    FrameChar.chars = {};
    return FrameChar;
}(frame_1.Frame));
exports.FrameChar = FrameChar;
;
