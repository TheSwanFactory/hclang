"use strict";
var frames_1 = require("../frames");
exports.tag = new frames_1.FrameExpr([
    new frames_1.FrameLazy(frames_1.Frame.nil),
    new frames_1.FrameArray([frames_1.FrameArg.level(2)]),
]);
var wrapArgs = function (prefix, suffix) {
    return new frames_1.FrameExpr([
        new frames_1.FrameString(prefix),
        frames_1.FrameArg.here(),
        new frames_1.FrameString(suffix),
    ]);
};
exports.tagLazy = function (name) {
    var expr = new frames_1.FrameExpr([
        new frames_1.FrameString("<" + name + ">"),
        frames_1.FrameArg.here(),
        new frames_1.FrameString("</" + name + ">"),
    ]);
    return new frames_1.FrameLazy(expr);
};
