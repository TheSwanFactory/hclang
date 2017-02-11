"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var terminals_1 = require("./terminals");
exports.ender = function (source, parameter) {
    var pipe = source;
    return pipe.finish();
};
var ParsePipe = (function (_super) {
    __extends(ParsePipe, _super);
    function ParsePipe(out) {
        var _this = this;
        var meta = {};
        meta[ParsePipe.kOUT] = out;
        meta[frames_1.Frame.kEND] = new terminals_1.LexTerminal(exports.ender);
        _this = _super.call(this, meta) || this;
        _this.data = new frames_1.FrameArray([]);
        return _this;
    }
    ParsePipe.prototype.finish = function () {
        var current = this.data.asArray();
        var expr = new frames_1.FrameExpr(current);
        var out = this.get(frames_1.Frame.kOUT);
        out.call(expr);
        return expr;
    };
    return ParsePipe;
}(frames_1.Frame));
exports.ParsePipe = ParsePipe;
var ParseToken = (function (_super) {
    __extends(ParseToken, _super);
    function ParseToken(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        return _this;
    }
    ParseToken.prototype.called_by = function (callee, parameter) {
        return callee.apply(this.data, parameter);
    };
    ParseToken.prototype.toData = function () { return this.data; };
    return ParseToken;
}(frames_1.FrameAtom));
exports.ParseToken = ParseToken;
