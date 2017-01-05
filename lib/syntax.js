"use strict";
var frames_1 = require("./frames");
var pipeline_1 = require("./syntax/pipeline");
var _ = require("lodash");
var framify = function (input) {
    var start = new frames_1.FrameString("");
    var output = _.reduce(input, pipeline_1.pipeline, start);
    return output;
};
exports.exec = function (input) {
    return framify(input).toString();
};
