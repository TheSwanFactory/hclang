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
var EvalPipe = (function (_super) {
    __extends(EvalPipe, _super);
    function EvalPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.set(frames_1.Frame.kOUT, out);
        _this.up = out;
        return _this;
    }
    EvalPipe.prototype.apply = function (expr, context) {
        var out = this.get(frames_1.Frame.kOUT);
        var result = expr.in([out, context]);
        out.apply(result, context);
        return result;
    };
    return EvalPipe;
}(frames_1.Frame));
exports.EvalPipe = EvalPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbC1waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvZXZhbC1waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUF1RDtBQUV2RDtJQUE4Qiw0QkFBSztJQUNqQyxrQkFBWSxHQUFVLEVBQUUsSUFBMEI7UUFBMUIscUJBQUEsRUFBQSwwQkFBMEI7UUFBbEQsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FHWjtRQUZDLEtBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxQixLQUFJLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQzs7SUFDaEIsQ0FBQztJQUVNLHdCQUFLLEdBQVosVUFBYSxJQUFXLEVBQUUsT0FBYztRQUN0QyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdkMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUFiRCxDQUE4QixjQUFLLEdBYWxDO0FBYlksNEJBQVEifQ==