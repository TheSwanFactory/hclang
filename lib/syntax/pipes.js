"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var tokens_1 = require("./tokens");
var LexPipe = (function (_super) {
    __extends(LexPipe, _super);
    function LexPipe(out) {
        var _this = this;
        tokens_1.tokens[LexPipe.kOUT] = out;
        _this = _super.call(this, tokens_1.tokens) || this;
        return _this;
    }
    LexPipe.prototype.lex_string = function (input) {
        var source = new frames_1.FrameString(input);
        return this.lex(source);
    };
    LexPipe.prototype.lex = function (source) {
        return source.reduce(this);
    };
    return LexPipe;
}(frames_1.Frame));
exports.LexPipe = LexPipe;
var EvalPipe = (function (_super) {
    __extends(EvalPipe, _super);
    function EvalPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = this;
        meta[EvalPipe.kOUT] = out;
        _this = _super.call(this, meta) || this;
        return _this;
    }
    return EvalPipe;
}(frames_1.Frame));
exports.EvalPipe = EvalPipe;
var ParsePipe = (function (_super) {
    __extends(ParsePipe, _super);
    function ParsePipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = this;
        meta[ParsePipe.kOUT] = out;
        _this = _super.call(this, meta) || this;
        return _this;
    }
    return ParsePipe;
}(frames_1.Frame));
exports.ParsePipe = ParsePipe;
var piper = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var result = new frames_1.FrameArray([], context);
    var evaluator = new EvalPipe(result);
    var parser = new ParsePipe(evaluator);
    var lexer = new LexPipe(parser);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return result;
};
