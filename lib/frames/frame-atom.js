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
var FrameAtom = (function (_super) {
    __extends(FrameAtom, _super);
    function FrameAtom(source, meta) {
        if (meta === void 0) { meta = frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.source = source;
        return _this;
    }
    FrameAtom.prototype.string_prefix = function () { return ""; };
    ;
    FrameAtom.prototype.string_suffix = function () { return ""; };
    ;
    FrameAtom.prototype.string_start = function () { return this.string_prefix(); };
    ;
    FrameAtom.prototype.toStringData = function () {
        return this.string_prefix() + this.toData().toString() + this.string_suffix();
    };
    FrameAtom.prototype.toString = function () {
        var dataString = this.toStringData();
        if (this.meta_length() === 0) {
            return dataString;
        }
        return this.string_open() + [dataString, this.meta_string()].join(", ") + this.string_close();
    };
    FrameAtom.prototype.canInclude = function (char) {
        return char !== this.string_suffix();
    };
    FrameAtom.prototype.toData = function () { return null; };
    return FrameAtom;
}(frame_1.Frame));
exports.FrameAtom = FrameAtom;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBNEM7QUFFNUM7SUFBK0IsNkJBQUs7SUFDbEMsbUJBQXNCLE1BQWMsRUFBRSxJQUFpQjtRQUFqQixxQkFBQSxFQUFBLHlCQUFpQjtRQUF2RCxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBRnFCLFlBQU0sR0FBTixNQUFNLENBQVE7O0lBRXBDLENBQUM7SUFFTSxpQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDL0IsaUNBQWEsR0FBcEIsY0FBeUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQy9CLGdDQUFZLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVoRCxnQ0FBWSxHQUFuQjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUNoRixDQUFDO0lBRU0sNEJBQVEsR0FBZjtRQUNFLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3BCLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDaEcsQ0FBQztJQUVNLDhCQUFVLEdBQWpCLFVBQWtCLElBQVk7UUFDNUIsTUFBTSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVTLDBCQUFNLEdBQWhCLGNBQTBCLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFDLGdCQUFDO0FBQUQsQ0FBQyxBQTFCRCxDQUErQixhQUFLLEdBMEJuQztBQTFCWSw4QkFBUyJ9