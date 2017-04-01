"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
        return this.array_eval(contexts);
    };
    return FrameGroup;
}(frame_list_1.FrameList));
exports.FrameGroup = FrameGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGlDQUFzQztBQUN0QywyQ0FBeUM7QUFFekM7SUFBZ0MsOEJBQVM7SUFDdkMsb0JBQVksSUFBa0IsRUFBRSxJQUFXO1FBQVgscUJBQUEsRUFBQSxtQkFBVztlQUN6QyxrQkFBTSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFTSx1QkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQVJELENBQWdDLHNCQUFTLEdBUXhDO0FBUlksZ0NBQVUifQ==