"use strict";
var frames_1 = require("./frames");
var tag_1 = require("./maml/tag");
var body = new frames_1.FrameString("body");
exports.maml = new frames_1.FrameExpr([
    new frames_1.FrameSymbol("tag"),
    body,
    frames_1.FrameArg.here(),
], { tag: tag_1.tag });
