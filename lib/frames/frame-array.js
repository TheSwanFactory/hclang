"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var FrameArray = (function (_super) {
    __extends(FrameArray, _super);
    function FrameArray(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        return _super.call(this, data, meta) || this;
    }
    FrameArray.prototype.string_open = function () { return FrameArray.BEGIN_ARRAY; };
    ;
    FrameArray.prototype.string_close = function () { return FrameArray.END_ARRAY; };
    ;
    FrameArray.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        contexts.push(this);
        return new FrameArray(this.data.map(function (f) { return f.in(contexts); }));
    };
    FrameArray.prototype.apply = function (argument, parameter) {
        this.data.push(argument);
        return this;
    };
    FrameArray.prototype.size = function () {
        return this.data.length;
    };
    FrameArray.prototype.at = function (index) {
        if (index >= this.size()) {
            return frame_1.Frame.missing;
        }
        return this.data[index];
    };
    return FrameArray;
}(frame_1.FrameList));
FrameArray.BEGIN_ARRAY = "[";
FrameArray.END_ARRAY = "]";
exports.FrameArray = FrameArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGlDQUFpRDtBQUVqRDtJQUFnQyw4QkFBUztJQUl2QyxvQkFBWSxJQUFrQixFQUFFLElBQVc7UUFBWCxxQkFBQSxFQUFBLG1CQUFXO2VBQ3pDLGtCQUFNLElBQUksRUFBRSxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVNLGdDQUFXLEdBQWxCLGNBQXVCLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDakQsaUNBQVksR0FBbkIsY0FBd0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVoRCx1QkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUUsVUFBQyxDQUFRLElBQUssT0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFkLENBQWMsQ0FBRSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVNLDBCQUFLLEdBQVosVUFBYSxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSx5QkFBSSxHQUFYO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzFCLENBQUM7SUFFTSx1QkFBRSxHQUFULFVBQVUsS0FBYTtRQUNyQixFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QixNQUFNLENBQUMsYUFBSyxDQUFDLE9BQU8sQ0FBQztRQUN2QixDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQS9CRCxDQUFnQyxpQkFBUztBQUNoQixzQkFBVyxHQUFHLEdBQUcsQ0FBQztBQUNsQixvQkFBUyxHQUFHLEdBQUcsQ0FBQztBQUY1QixnQ0FBVSJ9