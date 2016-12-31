"use strict";
var frames_1 = require("./frames");
var ops_1 = require("./ops");
var tag_1 = require("./maml/tag");
frames_1.Frame.globals = ops_1.Ops;
var HTML_PREFIX = "<!DOCTYPE html>";
var MakeTag = function (name, contents) {
    return new frames_1.FrameExpr([
        new frames_1.FrameSymbol("tag"),
        new frames_1.FrameString(name),
        contents,
    ]);
};
var HeadBlock = new frames_1.FrameLazy([
    new frames_1.FrameSymbol("tag"),
    frames_1.FrameParam.there(),
    frames_1.FrameArg.here(),
]);
var head = MakeTag("head", new frames_1.FrameExpr([
    frames_1.FrameArg.here(),
    new frames_1.FrameName("&&"),
    HeadBlock,
]));
var body = MakeTag("body", frames_1.FrameArg.here());
exports.maml = new frames_1.FrameExpr([
    new frames_1.FrameString(HTML_PREFIX),
    MakeTag("html", new frames_1.FrameExpr([head, body])),
], { tag: tag_1.tag });
