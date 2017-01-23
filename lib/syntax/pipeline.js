"use strict";
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var _ = require("lodash");
var router = new frames_1.Frame({
    " ": new lex_1.LexSpace(),
    "#": new lex_1.LexComment(),
    "“": new lex_1.LexString(),
});
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
