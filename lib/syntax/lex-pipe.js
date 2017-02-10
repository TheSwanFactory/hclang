"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var frames_1 = require("../frames");
var terminals_1 = require("./terminals");
var tokens_1 = require("./tokens");
exports.ender = function (source, parameter) {
    var pipe = source;
    return pipe.finish();
};
var meta = _.clone(tokens_1.tokens);
_.merge(meta, terminals_1.terminals);
meta[frames_1.Frame.kEND] = new terminals_1.LexTerminal(exports.ender);
var LexPipe = (function (_super) {
    __extends(LexPipe, _super);
    function LexPipe(out) {
        var _this = this;
        meta[frames_1.Frame.kOUT] = out;
        _this = _super.call(this, meta) || this;
        return _this;
    }
    LexPipe.prototype.lex_string = function (input) {
        var source = new frames_1.FrameString(input);
        return this.lex(source);
    };
    LexPipe.prototype.lex = function (source) {
        return source.reduce(this);
    };
    LexPipe.prototype.finish = function () {
        var output = frames_1.FrameSymbol.end();
        var out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    };
    return LexPipe;
}(frames_1.Frame));
exports.LexPipe = LexPipe;
