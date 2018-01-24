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
            _this.call = function (argument, parameter) {
                if (parameter === void 0) { parameter = Frame.nil; }
                return argument;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QiwyQ0FBOEQ7QUFFOUQ7SUFBMkIseUJBQVM7SUFZbEMsZUFBWSxJQUFpQixFQUFFLEtBQWE7UUFBaEMscUJBQUEsRUFBQSw4QkFBaUI7UUFBRSxzQkFBQSxFQUFBLGFBQWE7UUFBNUMsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FXWjtRQVZDLEtBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN4QixLQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1YsS0FBSSxDQUFDLFNBQVMsR0FBRyxVQUFDLE9BQWMsRUFBRSxTQUFnQjtnQkFDaEQsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNqQixDQUFDLENBQUM7WUFDRixLQUFJLENBQUMsSUFBSSxHQUFHLFVBQUMsUUFBZSxFQUFFLFNBQXFCO2dCQUFyQiwwQkFBQSxFQUFBLFlBQVksS0FBSyxDQUFDLEdBQUc7Z0JBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDbEIsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUFDSCxDQUFDO0lBRU0sMkJBQVcsR0FBbEIsY0FBdUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUMzQyw0QkFBWSxHQUFuQixjQUF3QixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRTFDLGtCQUFFLEdBQVQsVUFBVSxLQUFhO1FBQ3JCLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFTSxrQkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxxQkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVNLHlCQUFTLEdBQWhCLFVBQWlCLE9BQWMsRUFBRSxTQUFnQjtRQUMvQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVNLG9CQUFJLEdBQVgsVUFBWSxRQUFlLEVBQUUsU0FBcUI7UUFBckIsMEJBQUEsRUFBQSxZQUFZLEtBQUssQ0FBQyxHQUFHO1FBQ2hELE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRU0sd0JBQVEsR0FBZjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN2RSxDQUFDO0lBRU0sdUJBQU8sR0FBZDtRQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFTSxzQkFBTSxHQUFiO1FBQ0UsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FBQyxBQTVERCxDQUEyQixzQkFBUztBQUNYLFVBQUksR0FBRyxJQUFJLENBQUM7QUFDWixVQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ1osZ0JBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIsY0FBUSxHQUFHLEdBQUcsQ0FBQztBQUNmLFNBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyx1QkFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2xDLGFBQU8sR0FBVSxJQUFJLEtBQUssQ0FBQztJQUNoRCxPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUc7Q0FDbkIsQ0FBQyxDQUFDO0FBQ1csYUFBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7QUFUM0Isc0JBQUs7QUE0RGpCLENBQUMifQ==