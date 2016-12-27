"use strict";
var frames_1 = require("../frames");
exports.MetaMap = function (source, block) {
    return source.meta_pairs().map(function (_a) {
        var key = _a[0], value = _a[1];
        var fkey = new frames_1.FrameString(key);
        return block.call(value, fkey);
    });
};