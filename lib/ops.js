"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("./frames");
var iterators_1 = require("./ops/iterators");
var FrameCurry = (function (_super) {
    __extends(FrameCurry, _super);
    function FrameCurry(Func, Source) {
        var _this = _super.call(this) || this;
        _this.Func = Func;
        _this.Source = Source;
        return _this;
    }
    FrameCurry.prototype.apply = function (argument, parameter) {
        return this.Func(this.Source, argument);
    };
    FrameCurry.prototype.toString = function () {
        return "FrameCurry(" + this.Source + ", " + this.Func + ")";
    };
    return FrameCurry;
}(frames_1.Frame));
var FrameOps = (function (_super) {
    __extends(FrameOps, _super);
    function FrameOps(OpsDict) {
        var _this = _super.call(this) || this;
        _this.OpsDict = OpsDict;
        return _this;
    }
    FrameOps.prototype.get = function (key, origin) {
        var func = this.OpsDict[key];
        if (func != null) {
            return this.curry(func, origin);
        }
        return frames_1.Frame.missing;
    };
    FrameOps.prototype.toString = function () {
        return this.OpsDict.toString();
    };
    FrameOps.prototype.curry = function (func, origin) {
        return new frames_1.FrameExpr([
            new FrameCurry(func, origin),
            frames_1.FrameArg.here(),
        ]);
    };
    return FrameOps;
}(frames_1.Frame));
exports.FrameOps = FrameOps;
exports.Ops = new FrameOps({
    "&&": iterators_1.MetaMap,
});
