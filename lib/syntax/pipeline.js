"use strict";
var frames_1 = require("../frames");
var _ = require("lodash");
exports.pipe = function (input) {
    var start = new frames_1.FrameString("");
    var output = _.reduce(input, exports.pipeline, start);
    return output;
};
exports.pipeline = function (output, char) {
    var frameChar = new frames_1.FrameString(char);
    var result = output.call(frameChar);
    console.log("pipeline " + result + " for " + frameChar);
    return result;
};
