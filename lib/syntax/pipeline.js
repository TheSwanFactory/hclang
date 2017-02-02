"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var parse_1 = require("./parse");
var EvalPipe = (function (_super) {
    __extends(EvalPipe, _super);
    function EvalPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.set(frames_1.Frame.kOUT, out);
        return _this;
    }
    return EvalPipe;
}(frames_1.Frame));
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
    var parser = new parse_1.ParsePipe(result);
    var status = pipe(input, parser);
    console.error("\n* framify_new.pipe returned " + status);
    var expr = result.at(0);
    return expr.call(result);
};
var pipe = function (input, out) {
    var output = new frames_1.FrameArray([]);
    var lexer = new lex_1.LexPipe(output);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return out.call(output);
};
