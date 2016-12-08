"use strict";
var frames_1 = require("../frames");
exports.tag = function (name, body) {
    return new frames_1.FrameExpr([
        new frames_1.FrameString("<" + name + ">"),
        body,
        new frames_1.FrameString("</" + name + ">"),
    ]);
};
var wrap_args = function (prefix, suffix) {
    return new frames_1.FrameExpr([
        new frames_1.FrameString(prefix),
        frames_1.FrameSymbol.here(),
        new frames_1.FrameString(suffix),
    ]);
};
var tag_lazy = function (contents) {
    return new frames_1.FrameExpr([
        wrap_args("<", ">"),
        new frames_1.FrameLazy(frames_1.FrameSymbol.here()),
        wrap_args("</", ">"),
    ]);
};
