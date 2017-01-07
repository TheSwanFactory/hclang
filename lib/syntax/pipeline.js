"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var _ = require("lodash");
var Router = (function (_super) {
    __extends(Router, _super);
    function Router() {
        _super.apply(this, arguments);
    }
    return Router;
}(frames_1.Frame));
;
var router = new Router({
    "“": new lex_1.LexString(),
    "#": new lex_1.LexComment(),
});
exports.pipe = function (input) {
    var output = _.reduce(input, pipeline, router);
    return output;
};
var pipeline = function (current, char) {
    var frameChar = frames_1.FrameSymbol.for(char);
    console.log("*  pipeline " + current + ".call(" + frameChar + ")");
    var next = current.call(frameChar);
    console.log("** pipeline -> " + next + " ");
    return next;
};
