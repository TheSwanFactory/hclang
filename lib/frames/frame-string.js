"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameString = (function (_super) {
    __extends(FrameString, _super);
    function FrameString(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, meta);
        this.data = data;
    }
    FrameString.prototype.apply = function (argument) {
        this.data = this.data.concat(argument.data);
        return this;
    };
    FrameString.prototype.toStringData = function () {
        return this.data;
    };
    ;
    FrameString.prototype.toString = function () {
        return FrameString.BEGIN_STRING + this.toStringData() + FrameString.END_STRING;
    };
    FrameString.BEGIN_STRING = "“";
    FrameString.END_STRING = "”";
    return FrameString;
}(frame_1.Frame));
exports.FrameString = FrameString;
;
