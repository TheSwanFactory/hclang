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
var frame_array_1 = require("./frame-array");
var meta_frame_1 = require("./meta-frame");
var FrameList = (function (_super) {
    __extends(FrameList, _super);
    function FrameList(data, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        return _this;
    }
    FrameList.prototype.toStringDataArray = function () {
        return this.data.map(function (obj) { return obj.toString(); });
    };
    ;
    FrameList.prototype.toStringArray = function () {
        var result = this.toStringDataArray();
        if (this.meta_length() > 0) {
            result.push(this.meta_string());
        }
        return result;
    };
    FrameList.prototype.toString = function () {
        return this.string_open() + this.toStringArray().join(", ") + this.string_close();
    };
    FrameList.prototype.asArray = function () {
        return this.data;
    };
    FrameList.prototype.size = function () {
        return this.data.length;
    };
    FrameList.prototype.array_eval = function (contexts) {
        contexts.push(this);
        return new frame_array_1.FrameArray(this.data.map(function (f) { return f.in(contexts); }));
    };
    return FrameList;
}(frame_1.Frame));
exports.FrameList = FrameList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBZ0M7QUFDaEMsNkNBQTJDO0FBQzNDLDJDQUFtRDtBQU1uRDtJQUErQiw2QkFBSztJQUNsQyxtQkFBc0IsSUFBa0IsRUFBRSxJQUFpQjtRQUFqQixxQkFBQSxFQUFBLDhCQUFpQjtRQUEzRCxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQWM7O0lBRXhDLENBQUM7SUFFTSxxQ0FBaUIsR0FBeEI7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUUsVUFBQyxHQUFVLElBQUssT0FBQSxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQWQsQ0FBYyxDQUFFLENBQUM7SUFDekQsQ0FBQztJQUFBLENBQUM7SUFFSyxpQ0FBYSxHQUFwQjtRQUNFLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3hDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVNLDRCQUFRLEdBQWY7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3BGLENBQUM7SUFFTSwyQkFBTyxHQUFkO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVNLHdCQUFJLEdBQVg7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDMUIsQ0FBQztJQUVTLDhCQUFVLEdBQXBCLFVBQXFCLFFBQXNCO1FBQ3pDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLElBQUksd0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRSxVQUFDLENBQVEsSUFBSyxPQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQWQsQ0FBYyxDQUFFLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBakNELENBQStCLGFBQUssR0FpQ25DO0FBakNZLDhCQUFTIn0=