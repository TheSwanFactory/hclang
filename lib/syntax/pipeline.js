"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var lex_routes = {
    " ": new lex_1.LexSpace(),
    "#": new lex_1.LexComment(),
    "“": new lex_1.LexString(),
};
var router = new frames_1.Frame(lex_routes);
var PipelineEvaluator = (function (_super) {
    __extends(PipelineEvaluator, _super);
    function PipelineEvaluator(up, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.up = up;
        return _this;
    }
    return PipelineEvaluator;
}(frames_1.Frame));
var PipelineParser = (function (_super) {
    __extends(PipelineParser, _super);
    function PipelineParser(up, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.up = up;
        return _this;
    }
    return PipelineParser;
}(frames_1.Frame));
var PipelineLexer = (function (_super) {
    __extends(PipelineLexer, _super);
    function PipelineLexer(up, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.up = up;
        return _this;
    }
    return PipelineLexer;
}(frames_1.Frame));
var piper = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var source = new frames_1.FrameString(input);
    var result = new frames_1.FrameArray([], context);
    var evaluator = new PipelineEvaluator(result);
    var parser = new PipelineParser(evaluator);
    var lexer = new PipelineLexer(parser, lex_routes);
    var status = source.reduce(lexer);
    if (status !== router) {
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
var pipe = function (input, out) {
    var output = new frames_1.FrameArray([]);
    router.set(lex_1.Lex.out, output);
    var status = _.reduce(input, pipeline, router);
    if (status !== router) {
        console.error("\n* pipe returned " + status);
    }
    return out.call(output);
};
var pipeline = function (current, char) {
    var frameChar = frames_1.FrameSymbol.for(char);
    var next = current.call(frameChar);
    return next;
};
