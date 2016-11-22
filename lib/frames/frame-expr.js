"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameExpr = (function (_super) {
    __extends(FrameExpr, _super);
    function FrameExpr(data) {
        _super.call(this, data);
    }
    FrameExpr.prototype.call = function (argument) {
        return this;
    };
    FrameExpr.prototype.toStringData = function () {
        return this.data.map(function (obj) { return obj.toString(); }).join(" ");
    };
    ;
    FrameExpr.prototype.toString = function () {
        return FrameExpr.BEGIN + this.toStringData() + FrameExpr.END;
    };
    FrameExpr.BEGIN = "(";
    FrameExpr.END = ")";
    return FrameExpr;
}(frame_1.FrameArray));
exports.FrameExpr = FrameExpr;
;
