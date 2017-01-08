"use strict";
var pipeline_1 = require("./syntax/pipeline");
var framify = function (input) {
    return pipeline_1.pipe(input);
};
exports.exec = function (input) {
    return framify(input).toString();
};
