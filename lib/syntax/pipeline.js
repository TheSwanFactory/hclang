"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var _ = require("lodash");
var Router = (function (_super) {
    __extends(Router, _super);
    function Router() {
        _super.apply(this, arguments);
    }
    return Router;
}(frames_1.Frame));
exports.Router = Router;
;
exports.pipe = function (input) {
    var start = new frames_1.FrameString("");
    var output = _.reduce(input, exports.pipeline, start);
    return output;
};
exports.pipeline = function (current, char) {
    var frameChar = new frames_1.FrameString(char);
    var next = current.call(frameChar);
    console.log("pipeline " + next + " for " + frameChar);
    return next;
};
