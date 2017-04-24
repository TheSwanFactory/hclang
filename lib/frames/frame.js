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
var Frame = (function (_super) {
    __extends(Frame, _super);
    function Frame(meta, isNil) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        if (isNil === void 0) { isNil = false; }
        var _this = _super.call(this, meta) || this;
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
        if (this.meta === meta_frame_1.NilContext) {
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
Frame.nil = new Frame(meta_frame_1.NilContext, true);
Frame.missing = new Frame({
    missing: Frame.nil,
});
Frame.globals = Frame.missing;
exports.Frame = Frame;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QiwyQ0FBOEQ7QUFJOUQ7SUFBMkIseUJBQVM7SUFhbEMsZUFBWSxJQUFpQixFQUFFLEtBQWE7UUFBaEMscUJBQUEsRUFBQSw4QkFBaUI7UUFBRSxzQkFBQSxFQUFBLGFBQWE7UUFBNUMsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FRWjtRQVBDLEtBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN4QixLQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1YsS0FBSSxDQUFDLFNBQVMsR0FBRyxVQUFDLE9BQWMsRUFBRSxTQUFnQjtnQkFDaEQsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNqQixDQUFDLENBQUM7UUFDSixDQUFDOztJQUNILENBQUM7SUFFTSwyQkFBVyxHQUFsQixjQUF1QixNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQzNDLDRCQUFZLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFMUMsd0JBQVEsR0FBZixVQUFnQixHQUFXLEVBQUUsTUFBb0I7UUFBcEIsdUJBQUEsRUFBQSxhQUFvQjtRQUMvQyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFBQSxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO0lB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