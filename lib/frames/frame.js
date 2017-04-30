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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QiwyQ0FBOEQ7QUFFOUQ7SUFBMkIseUJBQVM7SUFZbEMsZUFBWSxJQUFpQixFQUFFLEtBQWE7UUFBaEMscUJBQUEsRUFBQSw4QkFBaUI7UUFBRSxzQkFBQSxFQUFBLGFBQWE7UUFBNUMsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FRWjtRQVBDLEtBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN4QixLQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1YsS0FBSSxDQUFDLFNBQVMsR0FBRyxVQUFDLE9BQWMsRUFBRSxTQUFnQjtnQkFDaEQsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNqQixDQUFDLENBQUM7UUFDSixDQUFDOztJQUNILENBQUM7SUFFTSwyQkFBVyxHQUFsQixjQUF1QixNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQzNDLDRCQUFZLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFMUMsa0JBQUUsR0FBVCxVQUFVLEtBQWE7UUFDckIsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7SUFDbkIsQ0FBQztJQUVNLGtCQUFFLEdBQVQsVUFBVSxRQUFzQjtRQUF0Qix5QkFBQSxFQUFBLFlBQVksS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLHFCQUFLLEdBQVosVUFBYSxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRU0seUJBQVMsR0FBaEIsVUFBaUIsT0FBYyxFQUFFLFNBQWdCO1FBQy9DLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sb0JBQUksR0FBWCxVQUFZLFFBQWUsRUFBRSxTQUFxQjtRQUFyQiwwQkFBQSxFQUFBLFlBQVksS0FBSyxDQUFDLEdBQUc7UUFDaEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFTSx3QkFBUSxHQUFmO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3ZFLENBQUM7SUFFTSx1QkFBTyxHQUFkO1FBQ0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVNLHNCQUFNLEdBQWI7UUFDRSxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUNILFlBQUM7QUFBRCxDQUFDLEFBekRELENBQTJCLHNCQUFTO0FBQ1gsVUFBSSxHQUFHLElBQUksQ0FBQztBQUNaLFVBQUksR0FBRyxJQUFJLENBQUM7QUFDWixnQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixjQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ2YsU0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLHVCQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbEMsYUFBTyxHQUFVLElBQUksS0FBSyxDQUFDO0lBQ2hELE9BQU8sRUFBRSxLQUFLLENBQUMsR0FBRztDQUNuQixDQUFDLENBQUM7QUFDVyxhQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQVQzQixzQkFBSztBQXlEakIsQ0FBQyJ9