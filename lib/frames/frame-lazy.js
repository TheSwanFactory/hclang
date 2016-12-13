"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_array_1 = require("./frame-array");
var frame_expr_1 = require("./frame-expr");
var FrameLazy = (function (_super) {
    __extends(FrameLazy, _super);
    function FrameLazy(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, meta);
        this.data = data;
    }
    FrameLazy.prototype.in = function (context) {
        if (this.data === frame_1.Frame.nil) {
            return this;
        }
        var current = this.set(frame_1.Frame.kUP, context);
        return this.data.set(frame_1.Frame.kUP, current);
    };
    FrameLazy.prototype.call = function (argument) {
        if (argument instanceof frame_array_1.FrameArray) {
            var array = argument;
            return new frame_expr_1.FrameExpr(array.data);
        }
        return new frame_expr_1.FrameExpr([argument]);
    };
    FrameLazy.prototype.toString = function () {
        return FrameLazy.LAZY_BEGIN + " " + this.data.toString() + " " + FrameLazy.LAZY_END;
    };
    FrameLazy.LAZY_BEGIN = "{";
    FrameLazy.LAZY_END = "}";
    return FrameLazy;
}(frame_1.Frame));
exports.FrameLazy = FrameLazy;
;
