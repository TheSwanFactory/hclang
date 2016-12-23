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
        _super.call(this, data, meta);
    }
    FrameArray.prototype.string_open = function () { return FrameArray.BEGIN_ARRAY; };
    ;
    FrameArray.prototype.string_close = function () { return FrameArray.END_ARRAY; };
    ;
    FrameArray.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        contexts.push(this);
        return new FrameArray(this.data.map(function (f) { return f.in(contexts); }));
    };
    FrameArray.prototype.at = function (index) {
        return this.data[index];
    };
    FrameArray.BEGIN_ARRAY = "[";
    FrameArray.END_ARRAY = "]";
    return FrameArray;
}(frame_1.FrameList));
exports.FrameArray = FrameArray;
