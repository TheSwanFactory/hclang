"use strict";
var pipeline_1 = require("./syntax/pipeline");
exports.exec = function (input) {
    return pipeline_1.framify(input).toString();
};
