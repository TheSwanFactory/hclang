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
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        return _this;
    }
    FrameSymbol.for = function (symbol) {
        var exists = FrameSymbol.symbols[symbol];
        return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
    };
    FrameSymbol.direct = function (symbol) {
        var exists = FrameSymbol.directs[symbol];
        return exists || (FrameSymbol.directs[symbol] = new FrameSymbol(symbol, { "!": frame_1.Frame.nil }));
    };
    FrameSymbol.end = function () { return FrameSymbol.direct(frame_1.Frame.kEND); };
    ;
    FrameSymbol.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        for (var _i = 0, contexts_1 = contexts; _i < contexts_1.length; _i++) {
            var context_1 = contexts_1[_i];
            var value = context_1.get(this.data);
            if (value !== frame_1.Frame.missing) {
                value.up = context_1;
                var direct = this.get_here(FrameSymbol.kDIRECT);
                if (direct === frame_1.Frame.missing) {
                    return value;
                }
                else {
                    console.log(" * direct");
                    return value.call(context_1);
                }
            }
        }
        return frame_1.Frame.missing;
    };
    FrameSymbol.prototype.called_by = function (context) {
        return this.in([context]);
    };
    FrameSymbol.prototype.toData = function () { return this.data; };
    return FrameSymbol;
}(frame_1.FrameAtom));
FrameSymbol.symbols = {};
FrameSymbol.directs = {};
exports.FrameSymbol = FrameSymbol;
;
