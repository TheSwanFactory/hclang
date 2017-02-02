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
        tokens_1.tokens[frames_1.Frame.kOUT] = out;
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
        meta[frames_1.Frame.kOUT] = out;
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
        meta[frames_1.Frame.kOUT] = out;
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
exports.framify_new = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var result = new frames_1.FrameArray([], context);
    var parser = new ParsePipe(result);
    var status = pipe(input, parser);
    console.error("\n* framify_new.pipe returned " + status);
    var expr = result.at(0);
    return expr.call(result);
};
var pipe = function (input, out) {
    var output = new frames_1.FrameArray([]);
    var lexer = new LexPipe(output);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return out.call(output);
};