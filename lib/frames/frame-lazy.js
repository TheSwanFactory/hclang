"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameLazy = (function (_super) {
    __extends(FrameLazy, _super);
    function FrameLazy(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        _super.call(this, meta);
        this.data = data;
    }
    FrameLazy.prototype.in = function (context) {
        var current = this.set(frame_1.Frame.kUP, context);
        return this.data.set(frame_1.Frame.kUP, current);
    };
    FrameLazy.prototype.toString = function () {
        return FrameLazy.BEGIN_LAZY + " " + this.data.toString() + " " + FrameLazy.END_LAZY;
    };
    FrameLazy.BEGIN_LAZY = "{";
    FrameLazy.END_LAZY = "}";
    return FrameLazy;
}(frame_1.Frame));
exports.FrameLazy = FrameLazy;
;
