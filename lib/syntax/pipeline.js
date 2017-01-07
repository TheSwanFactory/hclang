"use strict";
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var _ = require("lodash");
var router = new frames_1.Frame({
    "“": new lex_1.LexString(),
    "#": new lex_1.LexComment(),
});
exports.pipe = function (input) {
    var output = _.reduce(input, pipeline, router);
    return output;
};
var pipeline = function (current, char) {
    var frameChar = frames_1.FrameSymbol.for(char);
    console.log("*  pipeline " + current + ".call(" + frameChar + ")");
    var next = current.call(frameChar);
    console.log("** pipeline -> " + next);
    return next;
};
