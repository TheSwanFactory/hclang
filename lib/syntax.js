"use strict";
var pipeline_1 = require("./syntax/pipeline");
var _ = require("lodash");
exports.exec = function (input) {
    var output = "";
    return _.reduce(input, pipeline_1.pipeline, output);
};
