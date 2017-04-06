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
    function FrameAtom(meta) {
        if (meta === void 0) { meta = frame_1.NilContext; }
        return _super.call(this, meta) || this;
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
var FrameQuote = (function (_super) {
    __extends(FrameQuote, _super);
    function FrameQuote() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FrameQuote;
}(FrameAtom));
exports.FrameQuote = FrameQuote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBcUQ7QUFPckQ7SUFBK0IsNkJBQUs7SUFDbEMsbUJBQVksSUFBaUI7UUFBakIscUJBQUEsRUFBQSx5QkFBaUI7ZUFDM0Isa0JBQU0sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVNLGlDQUFhLEdBQXBCLGNBQXlCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUMvQixpQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDL0IsZ0NBQVksR0FBbkIsY0FBd0IsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRWhELGdDQUFZLEdBQW5CO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ2hGLENBQUM7SUFFTSw0QkFBUSxHQUFmO1FBQ0UsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3ZDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDcEIsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNoRyxDQUFDO0lBRU0sOEJBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUM1QixNQUFNLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRVMsMEJBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUMsZ0JBQUM7QUFBRCxDQUFDLEFBMUJELENBQStCLGFBQUssR0EwQm5DO0FBMUJZLDhCQUFTO0FBNEJ0QjtJQUFnQyw4QkFBUztJQUF6Qzs7SUFDQSxDQUFDO0lBQUQsaUJBQUM7QUFBRCxDQUFDLEFBREQsQ0FBZ0MsU0FBUyxHQUN4QztBQURZLGdDQUFVIn0=