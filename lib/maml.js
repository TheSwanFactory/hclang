"use strict";
var frames_1 = require("./frames");
var tag_1 = require("./maml/tag");
var HTML_PREFIX = "<!DOCTYPE html>";
var MakeTag = function (name, contents) {
    return new frames_1.FrameExpr([
        new frames_1.FrameSymbol("tag"),
        new frames_1.FrameString(name),
        contents,
    ]);
};
var title = MakeTag("title", new frames_1.FrameSymbol("title"));
var head = MakeTag("head", title);
var body = MakeTag("body", frames_1.FrameArg.here());
exports.maml = new frames_1.FrameExpr([
    new frames_1.FrameString(HTML_PREFIX),
    MakeTag("html", new frames_1.FrameExpr([head, body])),
], { tag: tag_1.tag });
