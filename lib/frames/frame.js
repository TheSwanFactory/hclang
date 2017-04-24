"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var meta_frame_1 = require("./meta-frame");
exports.NilContext = {};
var Frame = (function (_super) {
    __extends(Frame, _super);
    function Frame(meta, isNil) {
        if (meta === void 0) { meta = exports.NilContext; }
        if (isNil === void 0) { isNil = false; }
        var _this = _super.call(this) || this;
        _this.meta = meta;
        _this.up = Frame.missing;
        _this.callme = false;
        if (isNil) {
            _this.called_by = function (context, parameter) {
                return context;
            };
        }
        return _this;
    }
    Frame.prototype.string_open = function () { return Frame.BEGIN_EXPR; };
    ;
    Frame.prototype.string_close = function () { return Frame.END_EXPR; };
    ;
    Frame.prototype.get_here = function (key, origin) {
        if (origin === void 0) { origin = this; }
        var result = this.meta[key];
        if (result != null) {
            return result;
        }
        ;
        return Frame.missing;
    };
    Frame.prototype.get = function (key, origin) {
        if (origin === void 0) { origin = this; }
        var result = this.get_here(key, origin);
        if (result !== Frame.missing) {
            return result;
        }
        ;
        var source = this.up || Frame.globals;
        if (source === Frame.missing) {
            if (Frame.globals === Frame.missing) {
                return Frame.missing;
            }
            ;
            source = Frame.globals;
        }
        return source.get(key, origin);
    };
    Frame.prototype.set = function (key, value) {
        if (this.meta === exports.NilContext) {
            this.meta = {};
        }
        this.meta[key] = value;
        return this;
    };
    Frame.prototype.at = function (index) {
        return Frame.nil;
    };
    Frame.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [Frame.nil]; }
        return this;
    };
    Frame.prototype.apply = function (argument, parameter) {
        return argument;
    };
    Frame.prototype.called_by = function (context, parameter) {
        return context.apply(this, parameter);
    };
    Frame.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = Frame.nil; }
        return argument.called_by(this, parameter);
    };
    Frame.prototype.meta_copy = function () {
        return _.clone(this.meta);
    };
    Frame.prototype.meta_keys = function () {
        return _.keys(this.meta);
    };
    Frame.prototype.meta_length = function () {
        return this.meta_keys().length;
    };
    Frame.prototype.meta_pairs = function () {
        return _.map(this.meta, function (value, key) {
            return [key, value];
        });
    };
    Frame.prototype.meta_string = function () {
        return this.meta_pairs().map(function (_a) {
            var key = _a[0], value = _a[1];
            return "." + key + " " + value + ";";
        }).join(" ");
    };
    Frame.prototype.toString = function () {
        return this.string_open() + this.meta_string() + this.string_close();
    };
    Frame.prototype.asArray = function () {
        return _.castArray(this);
    };
    Frame.prototype.isVoid = function () {
        return false;
    };
    return Frame;
}(meta_frame_1.MetaFrame));
Frame.kOUT = ">>";
Frame.kEND = "$$";
Frame.BEGIN_EXPR = "(";
Frame.END_EXPR = ")";
Frame.nil = new Frame(exports.NilContext, true);
Frame.missing = new Frame({
    missing: Frame.nil,
});
Frame.globals = Frame.missing;
exports.Frame = Frame;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QiwyQ0FBeUM7QUFJNUIsUUFBQSxVQUFVLEdBQVksRUFBRSxDQUFDO0FBRXRDO0lBQTJCLHlCQUFTO0lBYWxDLGVBQW9CLElBQWlCLEVBQUUsS0FBYTtRQUFoQyxxQkFBQSxFQUFBLHlCQUFpQjtRQUFFLHNCQUFBLEVBQUEsYUFBYTtRQUFwRCxZQUNFLGlCQUFPLFNBUVI7UUFUbUIsVUFBSSxHQUFKLElBQUksQ0FBYTtRQUVuQyxLQUFJLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDeEIsS0FBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDcEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNWLEtBQUksQ0FBQyxTQUFTLEdBQUcsVUFBQyxPQUFjLEVBQUUsU0FBZ0I7Z0JBQ2hELE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDakIsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUFDSCxDQUFDO0lBRU0sMkJBQVcsR0FBbEIsY0FBdUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUMzQyw0QkFBWSxHQUFuQixjQUF3QixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRTFDLHdCQUFRLEdBQWYsVUFBZ0IsR0FBVyxFQUFFLE1BQW9CO1FBQXBCLHVCQUFBLEVBQUEsYUFBb0I7UUFDL0MsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFBQyxDQUFD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