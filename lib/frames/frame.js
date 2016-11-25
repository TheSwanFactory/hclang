"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Void = {};
var Frame = (function () {
    function Frame(meta) {
        if (meta === void 0) { meta = Void; }
        this.meta = meta;
    }
    Frame.prototype.get = function (key) {
        return this.meta[key];
    };
    Frame.prototype.in = function (context) {
        if (context === void 0) { context = Frame.nil; }
        return this;
    };
    Frame.prototype.call = function (argument) {
        return argument;
    };
    Frame.prototype.toMetaString = function () {
        var result = [];
        for (var key in this.meta) {
            if (this.meta.hasOwnProperty(key)) {
                var value = this.meta[key];
                result.push("." + key + " " + value + ";");
            }
        }
        return result.join(" ");
    };
    Frame.prototype.toString = function () {
        return Frame.BEGIN + this.toMetaString() + Frame.END;
    };
    Frame.BEGIN = "(";
    Frame.END = ")";
    Frame.nil = new Frame();
    return Frame;
}());
exports.Frame = Frame;
;
var FrameArray = (function (_super) {
    __extends(FrameArray, _super);
    function FrameArray(data, meta) {
        if (meta === void 0) { meta = Void; }
        _super.call(this, meta);
        this.data = data;
    }
    FrameArray.prototype.at = function (index) {
        return this.data[index];
    };
    return FrameArray;
}(Frame));
exports.FrameArray = FrameArray;
