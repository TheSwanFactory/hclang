"use strict";
var frames_1 = require("../frames");
exports.pipeline = function (output, char) {
    var frameChar = new frames_1.FrameString(char);
    var result = output.call(frameChar);
    console.log("pipeline " + result + " for " + frameChar);
    return result;
};
