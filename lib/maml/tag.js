"use strict";
var frames_1 = require("../frames");
var wrapArg = function (prefix, suffix) {
    return new frames_1.FrameExpr([
        new frames_1.FrameString(prefix),
        frames_1.FrameArg.here(),
        new frames_1.FrameString(suffix),
    ]);
};
exports.tag = new frames_1.FrameExpr([
    new frames_1.FrameLazy([]),
    new frames_1.FrameArray([
        wrapArg("<", ">"),
        frames_1.FrameArg.level(2),
        wrapArg("</", ">"),
    ]),
]);
