"use strict";
var frames_1 = require("../frames");
exports.tag = function (name, body) {
    return new frames_1.FrameExpr([
        new frames_1.FrameString("<" + name + ">"),
        body,
        new frames_1.FrameString("</" + name + ">"),
    ]);
};
