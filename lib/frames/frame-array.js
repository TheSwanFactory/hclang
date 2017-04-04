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
var FrameArray = (function (_super) {
    __extends(FrameArray, _super);
    function FrameArray(data, meta) {
        if (meta === void 0) { meta = frame_1.NilContext; }
        return _super.call(this, data, meta) || this;
    }
    FrameArray.prototype.string_open = function () { return FrameArray.BEGIN_ARRAY; };
    ;
    FrameArray.prototype.string_close = function () { return FrameArray.END_ARRAY; };
    ;
    FrameArray.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        return this.array_eval(contexts);
    };
    FrameArray.prototype.apply = function (argument, parameter) {
        if (!argument.isVoid()) {
            this.data.push(argument);
        }
        return this;
    };
    FrameArray.prototype.at = function (index) {
        if (index >= this.size()) {
            return frame_1.Frame.missing;
        }
        return this.data[index];
    };
    FrameArray.prototype.reset = function () {
        this.data = [];
    };
    return FrameArray;
}(frame_list_1.FrameList));
FrameArray.BEGIN_ARRAY = "[";
FrameArray.END_ARRAY = "]";
exports.FrameArray = FrameArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLGlDQUE0QztBQUM1QywyQ0FBeUM7QUFFekM7SUFBZ0MsOEJBQVM7SUFJdkMsb0JBQVksSUFBa0IsRUFBRSxJQUFpQjtRQUFqQixxQkFBQSxFQUFBLHlCQUFpQjtlQUMvQyxrQkFBTSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFTSxnQ0FBVyxHQUFsQixjQUF1QixNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ2pELGlDQUFZLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFaEQsdUJBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFTSwwQkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSx1QkFBRSxHQUFULFVBQVUsS0FBYTtRQUNyQixFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QixNQUFNLENBQUMsYUFBSyxDQUFDLE9BQU8sQ0FBQztRQUN2QixDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVNLDBCQUFLLEdBQVo7UUFDRSxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBaENELENBQWdDLHNCQUFTO0FBQ2hCLHNCQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLG9CQUFTLEdBQUcsR0FBRyxDQUFDO0FBRjVCLGdDQUFVIn0=