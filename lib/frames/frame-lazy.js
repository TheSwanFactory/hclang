"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameLazy = (function (_super) {
    __extends(FrameLazy, _super);
    function FrameLazy() {
        _super.apply(this, arguments);
    }
    FrameLazy.prototype.toString = function () {
        return this.toString();
    };
    return FrameLazy;
}(frame_1.Frame));
exports.FrameLazy = FrameLazy;
;
