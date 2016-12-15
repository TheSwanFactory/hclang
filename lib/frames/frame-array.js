"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameArray = (function (_super) {
    __extends(FrameArray, _super);
    function FrameArray(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, meta);
        this.data = data;
    }
    FrameArray.prototype.group_begin = function () { return FrameArray.BEGIN_ARRAY; };
    ;
    FrameArray.prototype.group_end = function () { return FrameArray.END_ARRAY; };
    ;
    FrameArray.prototype.in = function (context) {
        if (context === void 0) { context = frame_1.Frame.nil; }
        return new FrameArray(this.data.map(function (f) { return f.in(context); }));
    };
    FrameArray.prototype.at = function (index) {
        return this.data[index];
    };
    FrameArray.prototype.toStringData = function () {
        return this.data.map(function (obj) { return obj.toString(); }).join(", ");
    };
    ;
    FrameArray.BEGIN_ARRAY = "[";
    FrameArray.END_ARRAY = "]";
    return FrameArray;
}(frame_1.Frame));
exports.FrameArray = FrameArray;
