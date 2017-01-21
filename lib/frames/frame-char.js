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
        var _this = _super.call(this) || this;
        _this.data = data;
        return _this;
    }
    FrameChar.for = function (char) {
        var exists = FrameChar.chars[char];
        return exists || (FrameChar.chars[char] = new FrameChar(char));
    };
    FrameChar.prototype.string_prefix = function () { return FrameChar.CHAR_BEGIN; };
    ;
    FrameChar.prototype.toData = function () { return this.data; };
    return FrameChar;
}(frame_1.FrameAtom));
FrameChar.CHAR_BEGIN = "\\\\";
FrameChar.chars = {};
exports.FrameChar = FrameChar;
;
