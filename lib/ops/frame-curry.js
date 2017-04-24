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
var frames_1 = require("../frames");
var FrameCurry = (function (_super) {
    __extends(FrameCurry, _super);
    function FrameCurry(Func, Source) {
        var _this = _super.call(this) || this;
        _this.Func = Func;
        _this.Source = Source;
        return _this;
    }
    FrameCurry.prototype.apply = function (argument, parameter) {
        return this.Func(this.Source, argument);
    };
    FrameCurry.prototype.toString = function () {
        return "FrameCurry(" + this.Source + ", " + this.Func + ")";
    };
    return FrameCurry;
}(frames_1.Frame));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY3VycnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb3BzL2ZyYW1lLWN1cnJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUF1RDtBQUl2RDtJQUF5Qiw4QkFBSztJQUM1QixvQkFBc0IsSUFBb0IsRUFBWSxNQUFhO1FBQW5FLFlBQ0UsaUJBQU8sU0FDUjtRQUZxQixVQUFJLEdBQUosSUFBSSxDQUFnQjtRQUFZLFlBQU0sR0FBTixNQUFNLENBQU87O0lBRW5FLENBQUM7SUFFTSwwQkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVNLDZCQUFRLEdBQWY7UUFDRSxNQUFNLENBQUMsZ0JBQWMsSUFBSSxDQUFDLE1BQU0sVUFBSyxJQUFJLENBQUMsSUFBSSxNQUFHLENBQUM7SUFDcEQsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQVpELENBQXlCLGNBQUssR0FZN0IifQ==