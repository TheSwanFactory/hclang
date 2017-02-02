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
exports.framify = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var env = new frames_1.Frame(context);
    var codify = new frames_1.FrameLazy([]);
    var expr = pipe(input, codify);
    return expr.call(env);
};
var pipe = function (input, out) {
    var output = new frames_1.FrameArray([]);
    var lexer = new LexPipe(output);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return out.call(output);
};
