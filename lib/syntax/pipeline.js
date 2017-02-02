"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
<<<<<<< HEAD
var tokens_1 = require("./tokens");
var LexParse = (function (_super) {
    __extends(LexParse, _super);
    function LexParse(out) {
        var _this = this;
        tokens_1.tokens[frames_1.Frame.kOUT] = out;
        _this = _super.call(this, tokens_1.tokens) || this;
=======
var lex_1 = require("./lex");
var parse_1 = require("./parse");
var EvalPipe = (function (_super) {
    __extends(EvalPipe, _super);
    function EvalPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.set(frames_1.Frame.kOUT, out);
>>>>>>> master
        return _this;
    }
    LexParse.prototype.lex_string = function (input) {
        var source = new frames_1.FrameString(input);
        return this.lex(source);
    };
    LexParse.prototype.lex = function (source) {
        return source.reduce(this);
    };
    return LexParse;
}(frames_1.Frame));
<<<<<<< HEAD
exports.LexParse = LexParse;
=======
exports.EvalPipe = EvalPipe;
var piper = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var result = new frames_1.FrameArray([], context);
    var evaluator = new EvalPipe(result);
    var parser = new parse_1.ParsePipe(evaluator);
    var lexer = new lex_1.LexPipe(parser);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return result;
};
>>>>>>> master
exports.framify = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var env = new frames_1.Frame(context);
    var codify = new frames_1.FrameLazy([]);
    var expr = pipe(input, codify);
    return expr.call(env);
};
<<<<<<< HEAD
=======
exports.framify_new = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var result = new frames_1.FrameArray([], context);
    var parser = new parse_1.ParsePipe(result);
    var status = pipe(input, parser);
    console.error("\n* framify_new.pipe returned " + status);
    var expr = result.at(0);
    return expr.call(result);
};
>>>>>>> master
var pipe = function (input, out) {
    var output = new frames_1.FrameArray([]);
    var lexer = new LexParse(output);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return out.call(output);
};
