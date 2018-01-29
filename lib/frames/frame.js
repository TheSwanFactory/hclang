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
            _this.isVoid = function () {
                return true;
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
        if (this.isVoid()) {
            return context;
        }
        return context.apply(this, parameter);
    };
    Frame.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = Frame.nil; }
        if (this.isVoid()) {
            return argument;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QiwyQ0FBOEQ7QUFFOUQ7SUFBMkIseUJBQVM7SUFZbEMsZUFBWSxJQUFpQixFQUFFLEtBQWE7UUFBaEMscUJBQUEsRUFBQSw4QkFBaUI7UUFBRSxzQkFBQSxFQUFBLGFBQWE7UUFBNUMsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FRWjtRQVBDLEtBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN4QixLQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1YsS0FBSSxDQUFDLE1BQU0sR0FBRztnQkFDWixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2QsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUFDSCxDQUFDO0lBRU0sMkJBQVcsR0FBbEIsY0FBdUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUMzQyw0QkFBWSxHQUFuQixjQUF3QixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRTFDLGtCQUFFLEdBQVQsVUFBVSxLQUFhO1FBQ3JCLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFTSxrQkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxxQkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVNLHlCQUFTLEdBQWhCLFVBQWlCLE9BQWMsRUFBRSxTQUFnQjtRQUMvQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDakIsQ0FBQztRQUNELE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sb0JBQUksR0FBWCxVQUFZLFFBQWUsRUFBRSxTQUFxQjtRQUFyQiwwQkFBQSxFQUFBLFlBQVksS0FBSyxDQUFDLEdBQUc7UUFDaEQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQixNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ2xCLENBQUM7UUFDRCxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVNLHdCQUFRLEdBQWY7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDdkUsQ0FBQztJQUVNLHVCQUFPLEdBQWQ7UUFDRSxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRU0sc0JBQU0sR0FBYjtRQUNFLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDZixDQUFDO0lBQ0gsWUFBQztBQUFELENBQUMsQUEvREQsQ0FBMkIsc0JBQVM7QUFDWCxVQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ1osVUFBSSxHQUFHLElBQUksQ0FBQztBQUNaLGdCQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLGNBQVEsR0FBRyxHQUFHLENBQUM7QUFDZixTQUFHLEdBQUcsSUFBSSxLQUFLLENBQUMsdUJBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsQyxhQUFPLEdBQVUsSUFBSSxLQUFLLENBQUM7SUFDaEQsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHO0NBQ25CLENBQUMsQ0FBQztBQUNXLGFBQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBVDNCLHNCQUFLO0FBK0RqQixDQUFDIn0=