"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
exports.Curry = function (func, source) {
    return function (block) {
        return func(source, block);
    };
};
var FrameCurry = (function (_super) {
    __extends(FrameCurry, _super);
    function FrameCurry(func) {
        _super.call(this);
    }
    return FrameCurry;
}(frames_1.Frame));
exports.FrameCurry = FrameCurry;
exports.MetaMap = function (source, block) {
    var array = source.meta_pairs().map(function (_a) {
        var key = _a[0], value = _a[1];
        var fkey = new frames_1.FrameString(key);
        return block.call(value, fkey);
    });
    return new frames_1.FrameArray(array);
};
exports.MetaMapExpr = function (source) {
    return new frames_1.FrameExpr([
        new frames_1.FrameArray([]),
    ]);
};
