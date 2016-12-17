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
    Frame.prototype.string_open = function () { return Frame.BEGIN_EXPR; };
    ;
    Frame.prototype.string_close = function () { return Frame.END_EXPR; };
    ;
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
    Frame.prototype.set = function (key, value) {
        if (this.meta === exports.Void) {
            this.meta = {};
        }
        this.meta[key] = value;
        return this;
    };
    Frame.prototype.at = function (index) {
        return Frame.nil;
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
    Frame.prototype.meta_copy = function () {
        var clone = this.meta.constructor();
        for (var key in this.meta) {
            if (this.meta.hasOwnProperty(key)) {
                clone[key] = this.meta[key];
            }
        }
        return clone;
    };
    Frame.prototype.meta_keys = function () {
        return Object.keys(this.meta);
    };
    Frame.prototype.meta_length = function () {
        return this.meta_keys().length;
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
    Frame.prototype.toString = function () {
        return this.string_open() + this.meta_string() + this.string_close();
    };
    Frame.prototype.toArray = function () {
        return [];
    };
    Frame.BEGIN_EXPR = "(";
    Frame.END_EXPR = ")";
    Frame.kUP = ".up";
    Frame.nil = new Frame();
    Frame.missing = new Frame({
        missing: Frame.nil,
    });
    return Frame;
}());
exports.Frame = Frame;
;
var FrameAtom = (function (_super) {
    __extends(FrameAtom, _super);
    function FrameAtom() {
        _super.apply(this, arguments);
    }
    FrameAtom.prototype.string_prefix = function () { return ""; };
    ;
    FrameAtom.prototype.string_suffix = function () { return ""; };
    ;
    FrameAtom.prototype.toStringData = function () {
        return this.string_prefix() + this.toData().toString() + this.string_suffix();
    };
    FrameAtom.prototype.toString = function () {
        var DataString = this.toStringData();
        if (this.meta_length() === 0) {
            return DataString;
        }
        return this.string_open() + [DataString, this.meta_string()].join(", ") + this.string_close();
    };
    FrameAtom.prototype.toArray = function () {
        return [this];
    };
    FrameAtom.prototype.toData = function () { return null; };
    return FrameAtom;
}(Frame));
exports.FrameAtom = FrameAtom;
var FrameList = (function (_super) {
    __extends(FrameList, _super);
    function FrameList(data, meta) {
        if (meta === void 0) { meta = exports.Void; }
        _super.call(this, meta);
        this.data = data;
    }
    FrameList.prototype.toStringDataArray = function () {
        return this.data.map(function (obj) { return obj.toString(); });
    };
    ;
    FrameList.prototype.toStringArray = function () {
        var result = this.toStringDataArray();
        if (this.meta_length() > 0) {
            result.push(this.meta_string());
        }
        return result;
    };
    FrameList.prototype.toString = function () {
        return this.string_open() + this.toStringArray().join(", ") + this.string_close();
    };
    FrameList.prototype.toArray = function () {
        return this.data;
    };
    return FrameList;
}(Frame));
exports.FrameList = FrameList;
