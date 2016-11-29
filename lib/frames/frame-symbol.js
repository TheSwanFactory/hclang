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
    FrameSymbol.prototype.in = function (context) {
        if (context === void 0) { context = frame_1.Frame.nil; }
        if (this.data === "_") {
            return context;
        }
        return context.get(this.data);
    };
    FrameSymbol.prototype.called_by = function (context) {
        return this.in(context);
    };
    FrameSymbol.prototype.toString = function () {
        var meta = this.meta_string();
        if (meta !== "") {
            return "(" + meta + " " + this.data + ")";
        }
        return this.data;
    };
    FrameSymbol.symbols = {};
    return FrameSymbol;
}(frame_1.Frame));
exports.FrameSymbol = FrameSymbol;
;
