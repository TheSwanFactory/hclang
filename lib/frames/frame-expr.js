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
var frame_list_1 = require("./frame-list");
var meta_frame_1 = require("./meta-frame");
var FrameExpr = (function (_super) {
    __extends(FrameExpr, _super);
    function FrameExpr(data, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        var _this = _super.call(this, data, meta) || this;
        data.forEach(function (item) { item.up = _this; });
        return _this;
    }
    FrameExpr.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        contexts.push(this);
        return this.data.reduce(function (sum, item) {
            var value = item.in(contexts);
            var next_sum = sum.call(value);
            return next_sum;
        }, frame_1.Frame.nil);
    };
    FrameExpr.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frame_1.Frame.nil; }
        return this.in([argument, parameter]);
    };
    ;
    FrameExpr.prototype.toStringDataArray = function () {
        var array = _super.prototype.toStringDataArray.call(this);
        return [array.join(" ")];
    };
    return FrameExpr;
}(frame_list_1.FrameList));
exports.FrameExpr = FrameExpr;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZXhwci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtZXhwci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBZ0M7QUFFaEMsMkNBQXlDO0FBQ3pDLDJDQUFtRDtBQUVuRDtJQUErQiw2QkFBUztJQUN0QyxtQkFBWSxJQUFrQixFQUFFLElBQWlCO1FBQWpCLHFCQUFBLEVBQUEsOEJBQWlCO1FBQWpELFlBQ0Usa0JBQU0sSUFBSSxFQUFFLElBQUksQ0FBQyxTQUVsQjtRQURDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJLElBQU8sSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFDOUMsQ0FBQztJQUVNLHNCQUFFLEdBQVQsVUFBVSxRQUFzQjtRQUF0Qix5QkFBQSxFQUFBLFlBQVksYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFDLEdBQVUsRUFBRSxJQUFXO1lBQzlDLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsSUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ2xCLENBQUMsRUFBRSxhQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVNLHdCQUFJLEdBQVgsVUFBWSxRQUFlLEVBQUUsU0FBcUI7UUFBckIsMEJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHO1FBQ2hELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUFBLENBQUM7SUFFSyxxQ0FBaUIsR0FBeEI7UUFDRSxJQUFNLEtBQUssR0FBRyxpQkFBTSxpQkFBaUIsV0FBRSxDQUFDO1FBQ3hDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBdkJELENBQStCLHNCQUFTLEdBdUJ2QztBQXZCWSw4QkFBUztBQXVCckIsQ0FBQyJ9