"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
exports.Void = {};
var Frame = (function () {
    function Frame(meta) {
        if (meta === void 0) { meta = exports.Void; }
        this.meta = meta;
    }
    Frame.prototype.get_here = function (key) {
        var result = this.meta[key];
        if (result != null) {
            return result;
        }
        ;
        return Frame.missing;
    };
    Frame.prototype.get = function (key, origin) {
        if (origin === void 0) { origin = this; }
        var result = this.get_here(key);
        if (result !== Frame.missing) {
            return result;
        }
        ;
        var up = this.get_here(Frame.kUP);
        if (up === Frame.missing) {
            return Frame.missing;
        }
        ;
        return up.get(key, origin);
    };
    Frame.prototype.in = function (context) {
        if (context === void 0) { context = Frame.nil; }
        return this;
    };
    Frame.prototype.apply = function (argument) {
        return argument;
    };
    Frame.prototype.called_by = function (context) {
        return context.apply(this);
    };
    Frame.prototype.call = function (argument) {
        return argument.called_by(this);
    };
    Frame.prototype.meta_keys = function () {
        return Object.keys(this.meta);
    };
    Frame.prototype.meta_pairs = function () {
        var _this = this;
        var keys = this.meta_keys();
        return keys.map(function (key) {
            var pair = [key, _this.meta[key]];
            return pair;
        });
    };
    Frame.prototype.meta_string = function () {
        var pairs = this.meta_pairs();
        return pairs.map(function (_a) {
            var key = _a[0], value = _a[1];
            return "." + key + " " + value + ";";
        }).join(" ");
    };
    Frame.prototype.meta_wrap = function (dataString) {
        var meta = this.meta_string();
        if (meta !== "") {
            return "(" + dataString + ", " + meta + ")";
        }
        return dataString;
    };
    Frame.prototype.toString = function () {
        return Frame.BEGIN + this.meta_string() + Frame.END;
    };
    Frame.BEGIN = "(";
    Frame.END = ")";
    Frame.kUP = "up";
    Frame.nil = new Frame();
    Frame.missing = new Frame({
        missing: Frame.nil,
    });
    return Frame;
}());
exports.Frame = Frame;
;
var FrameArray = (function (_super) {
    __extends(FrameArray, _super);
    function FrameArray(data, meta) {
        if (meta === void 0) { meta = exports.Void; }
        _super.call(this, meta);
        this.data = data;
    }
    FrameArray.prototype.at = function (index) {
        return this.data[index];
    };
    return FrameArray;
}(Frame));
exports.FrameArray = FrameArray;
