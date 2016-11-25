"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_char_1 = require("./frame-char");
var FrameString = (function (_super) {
    __extends(FrameString, _super);
    function FrameString(JSstring) {
        var result = Array.prototype.map.call(JSstring, function (char) { return new frame_char_1.FrameChar(char); });
        _super.call(this, result);
    }
    FrameString.prototype.call = function (argument) {
        this.data = this.data.concat(argument.data);
        return this;
    };
    FrameString.prototype.toStringData = function () {
        return this.data.map(function (obj) { return obj.toStringData(); }).join("");
    };
    ;
    FrameString.prototype.toString = function () {
        return FrameString.BEGIN + this.toStringData() + FrameString.END;
    };
    FrameString.BEGIN = "“";
    FrameString.END = "”";
    return FrameString;
}(frame_1.FrameArray));
exports.FrameString = FrameString;
;
