"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_expr_1 = require("./frame-expr");
var FrameLazy = (function (_super) {
    __extends(FrameLazy, _super);
    function FrameLazy(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, data, meta);
    }
    FrameLazy.prototype.string_open = function () { return FrameLazy.LAZY_BEGIN + " "; };
    ;
    FrameLazy.prototype.string_close = function () { return " " + FrameLazy.LAZY_END; };
    ;
    FrameLazy.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        if (this.data.length === 0) {
            return this;
        }
        return new frame_expr_1.FrameExpr(this.data, this.meta_for(contexts[0]));
    };
    FrameLazy.prototype.call = function (argument) {
        return new frame_expr_1.FrameExpr(argument.asArray(), this.meta_for(argument));
    };
    FrameLazy.prototype.meta_for = function (context) {
        var MetaNew = this.meta_copy();
        var pairs = context.meta_pairs();
        pairs.map(function (_a) {
            var key = _a[0], value = _a[1];
            MetaNew[key] = value;
        });
        return MetaNew;
    };
    FrameLazy.LAZY_BEGIN = "{";
    FrameLazy.LAZY_END = "}";
    return FrameLazy;
}(frame_expr_1.FrameExpr));
exports.FrameLazy = FrameLazy;
;
