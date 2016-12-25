"use strict";
var frames_1 = require("./frames");
var tag_1 = require("./maml/tag");
var HTML_PREFIX = "<!DOCTYPE html>";
var make_tag = function (name, contents) {
    return new frames_1.FrameExpr([
        new frames_1.FrameSymbol("tag"),
        new frames_1.FrameString(name),
        contents,
    ]);
};
var title = make_tag("title", frames_1.FrameExpr.extract("title"));
var head = make_tag("head", title);
var body = make_tag("body", frames_1.FrameArg.here());
exports.maml = new frames_1.FrameExpr([
    new frames_1.FrameString(HTML_PREFIX),
    make_tag("html", new frames_1.FrameExpr([head, body])),
], { tag: tag_1.tag });
