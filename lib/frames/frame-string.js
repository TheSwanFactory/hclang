"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var frame_1 = require("./frame");
var frame_symbol_1 = require("./frame-symbol");
var reducer = function (current, char) {
    var symbol = frame_symbol_1.FrameSymbol.for(char);
    return current.call(symbol);
};
var FrameString = (function (_super) {
    __extends(FrameString, _super);
    function FrameString(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        return _this;
    }
    FrameString.prototype.apply = function (argument) {
        return new FrameString(this.data + argument.data);
    };
    FrameString.prototype.string_prefix = function () { return FrameString.STRING_BEGIN; };
    ;
    FrameString.prototype.string_suffix = function () { return FrameString.STRING_END; };
    ;
    FrameString.prototype.reduce = function (iteratee) {
        var final = _.reduce(this.data, reducer, iteratee);
        return final.call(frame_symbol_1.FrameSymbol.for("$fin"));
    };
    FrameString.prototype.toData = function () { return this.data; };
    return FrameString;
}(frame_1.FrameAtom));
FrameString.STRING_BEGIN = "“";
FrameString.STRING_END = "”";
exports.FrameString = FrameString;
;
