"use strict";
var frames_1 = require("./frames");
var tag_1 = require("./maml/tag");
var HTML_PREFIX = "<!DOCTYPE html>";
var body = function (level) {
    if (level === void 0) { level = 1; }
    return new frames_1.FrameExpr([
        new frames_1.FrameExpr([
            new frames_1.FrameSymbol("tag"),
            new frames_1.FrameString("body"),
            frames_1.FrameArg.here(),
        ]),
    ], { tag: tag_1.tag });
};
exports.maml = body();
