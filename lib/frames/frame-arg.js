"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_symbol_1 = require("./frame-symbol");
var FrameArg = (function (_super) {
    __extends(FrameArg, _super);
    function FrameArg(data) {
        _super.call(this, data);
    }
    FrameArg.here = function () {
        return FrameArg.level();
    };
    FrameArg.level = function (count) {
        if (count === void 0) { count = 1; }
        var symbol = Array(count + 1).join(FrameArg.ARG_CHAR);
        return FrameArg._for(symbol);
    };
    FrameArg._for = function (symbol) {
        var exists = FrameArg.args[symbol];
        return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
    };
    FrameArg.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        var level = this.data.length;
        if (level <= 1) {
            return contexts[0];
        }
        else {
            return FrameArg.level(level - 1);
        }
    };
    FrameArg.ARG_CHAR = "_";
    FrameArg.args = {};
    return FrameArg;
}(frame_symbol_1.FrameSymbol));
exports.FrameArg = FrameArg;
;
var FrameParam = (function (_super) {
    __extends(FrameParam, _super);
    function FrameParam(data) {
        _super.call(this, data);
    }
    FrameParam.there = function () {
        return FrameParam.level();
    };
    FrameParam.level = function (count) {
        if (count === void 0) { count = 1; }
        var symbol = FrameArg.ARG_CHAR + Array(count + 1).join(FrameParam.ARG_CHAR);
        return FrameParam._for(symbol);
    };
    FrameParam._for = function (symbol) {
        var exists = FrameParam.params[symbol];
        return exists || (FrameParam.params[symbol] = new FrameParam(symbol));
    };
    FrameParam.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        var level = this.data.length - 1;
        if (level <= contexts.length) {
            return contexts[level];
        }
        else {
            return frame_1.Frame.missing;
        }
    };
    FrameParam.ARG_CHAR = "^";
    FrameParam.params = {};
    return FrameParam;
}(frame_symbol_1.FrameSymbol));
exports.FrameParam = FrameParam;
;
