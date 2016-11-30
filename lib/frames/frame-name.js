"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_symbol_1 = require("./frame-symbol");
var FrameName = (function (_super) {
    __extends(FrameName, _super);
    function FrameName(symbol, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, meta);
        this.data = frame_symbol_1.FrameSymbol.for(symbol);
    }
    FrameName.prototype.in = function (context) {
        if (context === void 0) { context = frame_1.Frame.nil; }
        return this.data;
    };
    FrameName.prototype.toStringData = function () {
        return "." + this.data.toString();
    };
    FrameName.prototype.toString = function () {
        return this.meta_wrap(this.toStringData());
    };
    return FrameName;
}(frame_1.Frame));
exports.FrameName = FrameName;
;
