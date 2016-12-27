"use strict";
exports.Curry = function (func, source) {
    return function (block) {
        return func(source, block);
    };
};
var iterators_1 = require("./ops/iterators");
exports.MetaMap = iterators_1.MetaMap;
