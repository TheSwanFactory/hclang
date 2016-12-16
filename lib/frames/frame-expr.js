"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_arg_1 = require("./frame-arg");
var frame_name_1 = require("./frame-name");
var FrameExpr = (function (_super) {
    __extends(FrameExpr, _super);
    function FrameExpr(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, data, meta);
    }
    FrameExpr.extract = function (key) {
        return new FrameExpr([
            frame_arg_1.FrameArg.here(),
            new frame_name_1.FrameName(key),
        ]);
    };
    FrameExpr.prototype.in = function (context) {
        if (context === void 0) { context = frame_1.Frame.nil; }
        return this.data.reduce(function (sum, item) {
            var value = item.in(context);
            return sum.call(value);
        }, frame_1.Frame.nil);
    };
    FrameExpr.prototype.call = function (context) {
        return this.in(context);
    };
    ;
    return FrameExpr;
}(frame_1.FrameList));
exports.FrameExpr = FrameExpr;
;
