"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameExpr = (function (_super) {
    __extends(FrameExpr, _super);
    function FrameExpr(data, meta) {
        var _this = this;
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, data, meta);
        data.forEach(function (item) { item.up = _this; });
    }
    FrameExpr.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        contexts.push(this);
        return this.data.reduce(function (sum, item) {
            var value = item.in(contexts);
            return sum.call(value);
        }, frame_1.Frame.nil);
    };
    FrameExpr.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frame_1.Frame.nil; }
        return this.in([argument, parameter]);
    };
    ;
    FrameExpr.prototype.toStringDataArray = function () {
        var array = _super.prototype.toStringDataArray.call(this);
        return [array.join(" ")];
    };
    return FrameExpr;
}(frame_1.FrameList));
exports.FrameExpr = FrameExpr;
;
