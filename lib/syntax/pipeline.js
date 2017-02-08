"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var old_tokens_1 = require("./old_tokens");
var LexParse = (function (_super) {
    __extends(LexParse, _super);
    function LexParse(out) {
        var _this = this;
        old_tokens_1.tokens[LexParse.kOUT] = out;
        _this = _super.call(this, old_tokens_1.tokens) || this;
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
exports.LexParse = LexParse;
exports.framify = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var env = new frames_1.Frame(context);
    var codify = new frames_1.FrameLazy([]);
    var expr = pipe(input, codify);
    return expr.call(env);
};
var pipe = function (input, out) {
    var output = new frames_1.FrameArray([]);
    var lexer = new LexParse(output);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return out.call(output);
};
