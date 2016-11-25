"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameSymbol = (function (_super) {
    __extends(FrameSymbol, _super);
    function FrameSymbol(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, meta);
        this.data = data;
    }
    FrameSymbol.for = function (symbol) {
        var exists = FrameSymbol.symbols[symbol];
        return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
    };
    FrameSymbol.prototype.toString = function () {
        return this.data;
    };
    FrameSymbol.symbols = {};
    return FrameSymbol;
}(frame_1.Frame));
exports.FrameSymbol = FrameSymbol;
;
