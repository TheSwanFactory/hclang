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
    FrameLazy.prototype.toString = function () {
        return this.toString();
    };
    return FrameLazy;
}(frame_1.Frame));
exports.FrameLazy = FrameLazy;
;
