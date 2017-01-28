"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var lex_routes = {
    " ": new lex_1.LexSpace(),
    "#": new lex_1.LexComment(),
    "“": new lex_1.LexString(),
};
var EvalPipe = (function (_super) {
    __extends(EvalPipe, _super);
    function EvalPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = this;
        meta[lex_1.Lex.kOUT] = out;
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
        meta[lex_1.Lex.kOUT] = out;
        _this = _super.call(this, meta) || this;
        return _this;
    }
    return ParsePipe;
}(frames_1.Frame));
exports.ParsePipe = ParsePipe;
var LexPipe = (function (_super) {
    __extends(LexPipe, _super);
    function LexPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = this;
        meta[lex_1.Lex.kOUT] = out;
        _this = _super.call(this, meta) || this;
        return _this;
    }
    return LexPipe;
}(frames_1.Frame));
exports.LexPipe = LexPipe;
var piper = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var source = new frames_1.FrameString(input);
    var result = new frames_1.FrameArray([], context);
    var evaluator = new EvalPipe(result);
    var parser = new ParsePipe(evaluator);
    var lexer = new LexPipe(parser, lex_routes);
    var status = source.reduce(lexer);
    if (status !== lexer) {
        console.error("\n* pipe returned " + status);
    }
    return result;
};
exports.framify = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var env = new frames_1.Frame(context);
    var codify = new frames_1.FrameLazy([]);
    var expr = pipe(input, codify);
    return expr.call(env);
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
    var source = new frames_1.FrameString(input);
    var output = new frames_1.FrameArray([]);
    var router = new LexPipe(output, lex_routes);
    var status = source.reduce(router);
    if (status !== router) {
        console.error("\n* pipe returned " + status);
    }
    return out.call(output);
};
