"use strict";
var frames_1 = require("../frames");
var wrap_args = function (prefix, suffix) {
    return new frames_1.FrameExpr([
        new frames_1.FrameString(prefix),
        frames_1.FrameSymbol.here(),
        new frames_1.FrameString(suffix),
    ]);
};
exports.tag_lazy = function (name) {
    var expr = new frames_1.FrameExpr([
        new frames_1.FrameString("<" + name + ">"),
        frames_1.FrameSymbol.here(),
        new frames_1.FrameString("</" + name + ">"),
    ]);
    return new frames_1.FrameLazy(expr);
};
