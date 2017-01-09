"use strict";
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var _ = require("lodash");
var router = new frames_1.Frame({
    "#": new lex_1.LexComment(),
    " ": new lex_1.LexSpace(),
    "“": new lex_1.LexString(),
});
exports.pipe = function (input) {
    var output = new frames_1.FrameArray([]);
    router.set(lex_1.Lex.out, output);
    var status = _.reduce(input, pipeline, router);
    if (status !== router) {
        console.log("\n* pipe returned " + status);
    }
    return output;
};
var pipeline = function (current, char) {
    var frameChar = frames_1.FrameSymbol.for(char);
    console.log("* pipeline " + current + ".call(" + frameChar + ")");
    var next = current.call(frameChar);
    console.log("** -> " + next);
    return next;
};
