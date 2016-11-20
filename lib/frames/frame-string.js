"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameString = (function (_super) {
    __extends(FrameString, _super);
    function FrameString(JSstring) {
        _super.call(this);
    }
    FrameString.prototype.toString = function () {
        return "\u201C" + this.data.toString() + "\u201D";
    };
    return FrameString;
}(frame_1.FrameArray));
exports.FrameString = FrameString;
;
