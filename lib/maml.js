"use strict";
var frames_1 = require("./frames");
var tag_1 = require("./maml/tag");
var HTML_PREFIX = "<!DOCTYPE html>";
var body = [
    new frames_1.FrameSymbol("tag"),
    new frames_1.FrameString("body"),
    frames_1.FrameArg.here(),
];
exports.maml = new frames_1.FrameExpr([
    new frames_1.FrameString(HTML_PREFIX),
    new frames_1.FrameExpr([
        new frames_1.FrameSymbol("tag"),
        new frames_1.FrameString("html"),
        new frames_1.FrameExpr(body),
    ]),
], { tag: tag_1.tag });
