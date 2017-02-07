"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
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
var ParseTerminal = (function (_super) {
    __extends(ParseTerminal, _super);
    function ParseTerminal(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        return _this;
    }
    ParseTerminal.prototype.called_by = function (callee, parameter) {
        return this.data.call(callee, parameter);
    };
    ParseTerminal.prototype.toData = function () { return this.data; };
    return ParseTerminal;
}(frames_1.Frame));
exports.ParseTerminal = ParseTerminal;
var ParsePipe = (function (_super) {
    __extends(ParsePipe, _super);
    function ParsePipe(out) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.set(ParsePipe.kOUT, out);
        _this.data = new frames_1.FrameArray([]);
        return _this;
    }
    return ParsePipe;
}(frames_1.Frame));
exports.ParsePipe = ParsePipe;
