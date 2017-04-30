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
var frame_1 = require("./frame");
var frame_expr_1 = require("./frame-expr");
var meta_frame_1 = require("./meta-frame");
var FrameLazy = (function (_super) {
    __extends(FrameLazy, _super);
    function FrameLazy(data, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        return _super.call(this, data, meta) || this;
    }
    FrameLazy.prototype.string_open = function () { return FrameLazy.LAZY_BEGIN + " "; };
    ;
    FrameLazy.prototype.string_close = function () { return " " + FrameLazy.LAZY_END; };
    ;
    FrameLazy.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        if (this.data.length === 0) {
            return this;
        }
        var expr = new frame_expr_1.FrameExpr(this.data, this.meta_for(contexts[0]));
        expr.up = this;
        return expr;
    };
    FrameLazy.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frame_1.Frame.nil; }
        return new frame_expr_1.FrameExpr(argument.asArray(), this.meta_for(argument));
    };
    FrameLazy.prototype.meta_for = function (context) {
        var MetaNew = this.meta_copy();
        var pairs = context.meta_pairs();
        pairs.map(function (_a) {
            var key = _a[0], value = _a[1];
            MetaNew[key] = value;
        });
        return MetaNew;
    };
    return FrameLazy;
}(frame_expr_1.FrameExpr));
FrameLazy.LAZY_BEGIN = "{";
FrameLazy.LAZY_END = "}";
exports.FrameLazy = FrameLazy;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGF6eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGF6eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBZ0M7QUFDaEMsMkNBQXlDO0FBQ3pDLDJDQUFrRTtBQUVsRTtJQUErQiw2QkFBUztJQUl0QyxtQkFBWSxJQUFrQixFQUFFLElBQTBCO1FBQTFCLHFCQUFBLEVBQUEsOEJBQTBCO2VBQ3hELGtCQUFNLElBQUksRUFBRSxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVNLCtCQUFXLEdBQWxCLGNBQXVCLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ3JELGdDQUFZLEdBQW5CLGNBQXdCLE1BQU0sQ0FBRSxHQUFHLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXJELHNCQUFFLEdBQVQsVUFBVSxRQUFzQjtRQUF0Qix5QkFBQSxFQUFBLFlBQVksYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0QsSUFBTSxJQUFJLEdBQUcsSUFBSSxzQkFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSx3QkFBSSxHQUFYLFVBQVksUUFBZSxFQUFFLFNBQXFCO1FBQXJCLDBCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRztRQUNoRCxNQUFNLENBQUMsSUFBSSxzQkFBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVTLDRCQUFRLEdBQWxCLFVBQW1CLE9BQWM7UUFDL0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2pDLElBQU0sS0FBSyxHQUF5QixPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDekQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEVBQVk7Z0JBQVgsV0FBRyxFQUFFLGFBQUs7WUFBUSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxDQUFDLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBOUJELENBQStCLHNCQUFTO0FBQ2Ysb0JBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIsa0JBQVEsR0FBRyxHQUFHLENBQUM7QUFGM0IsOEJBQVM7QUE4QnJCLENBQUMifQ==