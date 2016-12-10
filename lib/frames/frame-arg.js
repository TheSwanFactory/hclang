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
    FrameArg.here = function () {
        return FrameArg.level();
    };
    FrameArg.level = function (count) {
        if (count === void 0) { count = 1; }
        var symbol = Array(count + 1).join(FrameArg.underbar);
        return FrameArg._for(symbol);
    };
    FrameArg._for = function (symbol) {
        var exists = FrameArg.args[symbol];
        return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
    };
    FrameArg.prototype.in = function (context) {
        var level = this.data.length;
        if (level <= 1) {
            return context;
        }
        else {
            return FrameArg.level(level - 1);
        }
    };
    FrameArg.args = {};
    FrameArg.underbar = "_";
    return FrameArg;
}(frame_symbol_1.FrameSymbol));
exports.FrameArg = FrameArg;
;
