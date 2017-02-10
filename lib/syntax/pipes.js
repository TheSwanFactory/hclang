"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_pipe_1 = require("./lex-pipe");
var parse_1 = require("./parse");
var EvalPipe = (function (_super) {
    __extends(EvalPipe, _super);
    function EvalPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.set(parse_1.ParsePipe.kOUT, out);
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
    var lexer = new lex_pipe_1.LexPipe(parser);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return result;
};
