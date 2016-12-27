"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("./frames");
exports.Curry = function (func, source) {
    return function (block) {
        return func(source, block);
    };
};
var iterators_1 = require("./ops/iterators");
exports.MetaMap = iterators_1.MetaMap;
var FrameCurry = (function (_super) {
    __extends(FrameCurry, _super);
    function FrameCurry(func) {
        _super.call(this);
    }
    return FrameCurry;
}(frames_1.Frame));
exports.FrameCurry = FrameCurry;
var FrameOps = (function (_super) {
    __extends(FrameOps, _super);
    function FrameOps(context) {
        _super.call(this, context);
    }
    return FrameOps;
}(frames_1.Frame));
exports.FrameOps = FrameOps;
exports.Ops = new FrameOps({
    "&&": new FrameCurry(iterators_1.MetaMap),
});
