"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var Lex = (function (_super) {
    __extends(Lex, _super);
    function Lex() {
        _super.apply(this, arguments);
        this.body = "";
    }
    Lex.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frames_1.Frame.nil; }
        if (this.isEnd(argument.toString())) {
            var result = this.makeFrame();
            this.body = "";
            return result;
        }
        this.body = this.body + argument.toString();
        return this;
    };
    Lex.prototype.getClassName = function () {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec(this.constructor.toString());
        return (results && results.length > 1) ? results[1] : "<class>";
    };
    Lex.prototype.toString = function () {
        return this.getClassName() + ("[" + this.body + "]");
    };
    Lex.prototype.isEnd = function (char) {
        return false;
    };
    Lex.prototype.makeFrame = function () {
        return frames_1.Frame.nil;
    };
    return Lex;
}(frames_1.Frame));
exports.Lex = Lex;
var LexString = (function (_super) {
    __extends(LexString, _super);
    function LexString() {
        _super.apply(this, arguments);
    }
    LexString.prototype.isEnd = function (char) {
        return char === "”";
    };
    LexString.prototype.makeFrame = function () {
        return new frames_1.FrameString(this.body);
    };
    return LexString;
}(Lex));
exports.LexString = LexString;
;
var LexComment = (function (_super) {
    __extends(LexComment, _super);
    function LexComment() {
        _super.apply(this, arguments);
    }
    LexComment.prototype.isEnd = function (char) {
        return char === "#" || char === "\n";
    };
    LexComment.prototype.makeFrame = function () {
        return frames_1.FrameSymbol.for("");
    };
    return LexComment;
}(Lex));
exports.LexComment = LexComment;
;
