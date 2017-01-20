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
        var _this = _super.call(this, meta) || this;
        _this.data = frame_symbol_1.FrameSymbol.for(symbol);
        return _this;
    }
    FrameName.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        return this.data;
    };
    FrameName.prototype.string_prefix = function () { return FrameName.NAME_BEGIN; };
    ;
    FrameName.prototype.toData = function () { return this.data; };
    return FrameName;
}(frame_1.FrameAtom));
FrameName.NAME_BEGIN = ".";
exports.FrameName = FrameName;
;
