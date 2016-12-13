"use strict";
var frames_1 = require("../frames");
var wrapArgs = function (prefix, suffix) {
    return new frames_1.FrameExpr([
        new frames_1.FrameString(prefix),
        frames_1.FrameArg.here(),
        new frames_1.FrameString(suffix),
    ]);
};
exports.tag = new frames_1.FrameExpr([
    new frames_1.FrameLazy(frames_1.Frame.nil),
    new frames_1.FrameArray([
        wrapArgs("<", ">"),
        frames_1.FrameArg.level(2),
        wrapArgs("</", ">"),
    ]),
]);
