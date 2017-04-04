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
exports.NilContext = {};
var Frame = (function () {
    function Frame(meta, isNil) {
        if (meta === void 0) { meta = exports.NilContext; }
        if (isNil === void 0) { isNil = false; }
        this.meta = meta;
        this.up = Frame.missing;
        this.callme = false;
        if (isNil) {
            this.called_by = function (context, parameter) {
                return context;
            };
        }
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
}());
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
var FrameAtom = (function (_super) {
    __extends(FrameAtom, _super);
    function FrameAtom() {
        return _super !== null && _super.apply(this, arguments) || this;
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
    FrameAtom.prototype.canInclude = function (char) {
        return char !== this.string_suffix();
    };
    FrameAtom.prototype.toData = function () { return null; };
    return FrameAtom;
}(Frame));
exports.FrameAtom = FrameAtom;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUlmLFFBQUEsVUFBVSxHQUFZLEVBQUUsQ0FBQztBQUV0QztJQWFFLGVBQW9CLElBQWlCLEVBQUUsS0FBYTtRQUFoQyxxQkFBQSxFQUFBLHlCQUFpQjtRQUFFLHNCQUFBLEVBQUEsYUFBYTtRQUFoQyxTQUFJLEdBQUosSUFBSSxDQUFhO1FBQ25DLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1YsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFDLE9BQWMsRUFBRSxTQUFnQjtnQkFDaEQsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNqQixDQUFDLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUVNLDJCQUFXLEdBQWxCLGNBQXVCLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDM0MsNEJBQVksR0FBbkIsY0FBd0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUUxQyx3QkFBUSxHQUFmLFVBQWdCLEdBQVcsRUFBRSxNQUFvQjtRQUFwQix1QkFBQSxFQUFBLGFBQW9CO1FBQy9DLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsRUFBRSxDQUFDLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQUMsQ0FBQztRQUFBLENBQUM7UUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7SUFD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