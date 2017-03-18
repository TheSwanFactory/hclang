"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_comment_1 = require("./frame-comment");
var FrameExpr = (function (_super) {
    __extends(FrameExpr, _super);
    function FrameExpr(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        var _this = _super.call(this, data, meta) || this;
        data.forEach(function (item) { item.up = _this; });
        return _this;
    }
    FrameExpr.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        contexts.push(this);
        return this.data.reduce(function (sum, item) {
            var value = item.in(contexts);
            if (value instanceof frame_comment_1.FrameComment) {
                return sum;
            }
            return sum.call(value);
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
}(frame_1.FrameList));
exports.FrameExpr = FrameExpr;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZXhwci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtZXhwci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxpQ0FBaUQ7QUFDakQsaURBQStDO0FBRS9DO0lBQStCLDZCQUFTO0lBQ3RDLG1CQUFZLElBQWtCLEVBQUUsSUFBVztRQUFYLHFCQUFBLEVBQUEsbUJBQVc7UUFBM0MsWUFDRSxrQkFBTSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBRWxCO1FBREMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQUksSUFBTyxJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUM5QyxDQUFDO0lBRU0sc0JBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQUMsR0FBVSxFQUFFLElBQVc7WUFDOUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5QixFQUFFLENBQUMsQ0FBQyxLQUFLLFlBQVksNEJBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDYixDQUFDO1lBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQyxFQUFFLGFBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBRU0sd0JBQUksR0FBWCxVQUFZLFFBQWUsRUFBRSxTQUFxQjtRQUFyQiwwQkFBQSxFQUFBLFlBQVksYUFBSyxDQUFDLEdBQUc7UUFDaEQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBQUEsQ0FBQztJQUVLLHFDQUFpQixHQUF4QjtRQUNFLElBQU0sS0FBSyxHQUFHLGlCQUFNLGlCQUFpQixXQUFFLENBQUM7UUFDeEMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUF6QkQsQ0FBK0IsaUJBQVMsR0F5QnZDO0FBekJZLDhCQUFTO0FBeUJyQixDQUFDIn0=