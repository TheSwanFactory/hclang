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
var FrameGroup = (function (_super) {
    __extends(FrameGroup, _super);
    function FrameGroup(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        return _super.call(this, data, meta) || this;
    }
    FrameGroup.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        if (this.size() > 1) {
            return this.array_eval(contexts);
        }
        var expr = this.data[0];
        contexts.push(this);
        var result = expr.in(contexts);
        this.meta_pairs().map(function (_a) {
            var key = _a[0], value = _a[1];
            result.set(key, value);
        });
        return result;
    };
    return FrameGroup;
}(frame_list_1.FrameList));
exports.FrameGroup = FrameGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLGlDQUFzQztBQUN0QywyQ0FBeUM7QUFFekM7SUFBZ0MsOEJBQVM7SUFDdkMsb0JBQVksSUFBa0IsRUFBRSxJQUFXO1FBQVgscUJBQUEsRUFBQSxtQkFBVztlQUN6QyxrQkFBTSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFTSx1QkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNELElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBQyxFQUFZO2dCQUFYLFdBQUcsRUFBRSxhQUFLO1lBQ2hDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBakJELENBQWdDLHNCQUFTLEdBaUJ4QztBQWpCWSxnQ0FBVSJ9