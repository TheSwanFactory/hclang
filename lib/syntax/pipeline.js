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
    function Router(factories) {
        _super.call(this);
        this.factories = factories;
    }
    Router.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frames_1.Frame.nil; }
        return new SyntaxString();
    };
    return Router;
}(frames_1.Frame));
;
var SyntaxString = (function (_super) {
    __extends(SyntaxString, _super);
    function SyntaxString() {
        _super.apply(this, arguments);
        this.body = new frames_1.FrameString("");
    }
    SyntaxString.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frames_1.Frame.nil; }
        if (argument.toString() === "“””") {
            return this.body;
        }
        this.body = this.body.call(argument);
        return this;
    };
    SyntaxString.prototype.toString = function () {
        return "SyntaxString[" + this.body + "]";
    };
    return SyntaxString;
}(frames_1.Frame));
;
var router = new Router({
    "“": SyntaxString,
});
exports.pipe = function (input) {
    var output = _.reduce(input, pipeline, router);
    return output;
};
var pipeline = function (current, char) {
    var frameChar = new frames_1.FrameString(char);
    console.log("*  pipeline " + current + ".call(" + frameChar + ")");
    var next = current.call(frameChar);
    console.log("** pipeline -> " + next + " ");
    return next;
};
