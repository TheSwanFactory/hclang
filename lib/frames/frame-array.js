"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_list_1 = require("./frame-list");
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
    FrameArray.prototype.reset = function () {
        this.data = [];
    };
    return FrameArray;
}(frame_list_1.FrameList));
FrameArray.BEGIN_ARRAY = "[";
FrameArray.END_ARRAY = "]";
exports.FrameArray = FrameArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGlDQUFzQztBQUN0QywyQ0FBeUM7QUFFekM7SUFBZ0MsOEJBQVM7SUFJdkMsb0JBQVksSUFBa0IsRUFBRSxJQUFXO1FBQVgscUJBQUEsRUFBQSxtQkFBVztlQUN6QyxrQkFBTSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFTSxnQ0FBVyxHQUFsQixjQUF1QixNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ2pELGlDQUFZLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFaEQsdUJBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFFLFVBQUMsQ0FBUSxJQUFLLE9BQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBZCxDQUFjLENBQUUsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFTSwwQkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0seUJBQUksR0FBWDtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRU0sdUJBQUUsR0FBVCxVQUFVLEtBQWE7UUFDckIsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekIsTUFBTSxDQUFDLGFBQUssQ0FBQyxPQUFPLENBQUM7UUFDdkIsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSwwQkFBSyxHQUFaO1FBQ0UsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQW5DRCxDQUFnQyxzQkFBUztBQUNoQixzQkFBVyxHQUFHLEdBQUcsQ0FBQztBQUNsQixvQkFBUyxHQUFHLEdBQUcsQ0FBQztBQUY1QixnQ0FBVSJ9