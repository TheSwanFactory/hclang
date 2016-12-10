"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_symbol_1 = require("./frame-symbol");
var FrameArg = (function (_super) {
    __extends(FrameArg, _super);
    function FrameArg(data) {
        _super.call(this, data);
    }
    FrameArg.for = function (symbol) {
        var exists = FrameArg.args[symbol];
        return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
    };
    FrameArg.here = function () {
        return FrameArg.level();
    };
    FrameArg.level = function (number) {
        if (number === void 0) { number = 1; }
        return FrameArg.for("_".repeat(number));
    };
    FrameArg.prototype.in = function (context) {
        return context;
    };
    FrameArg.args = {};
    return FrameArg;
}(frame_symbol_1.FrameSymbol));
exports.FrameArg = FrameArg;
;
