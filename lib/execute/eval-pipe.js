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
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.set(frames_1.Frame.kOUT, out);
        return _this;
    }
    EvalPipe.prototype.apply = function (expr, context) {
        var result = expr.in([context]);
        var out = this.get(frames_1.Frame.kOUT);
        out.call(result);
        return result;
    };
    return EvalPipe;
}(frames_1.Frame));
exports.EvalPipe = EvalPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbC1waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvZXZhbC1waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFpRDtBQUVqRDtJQUE4Qiw0QkFBSztJQUNqQyxrQkFBWSxHQUFVLEVBQUUsSUFBb0I7UUFBcEIscUJBQUEsRUFBQSxvQkFBb0I7UUFBNUMsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FFWjtRQURDLEtBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQzs7SUFDNUIsQ0FBQztJQUVNLHdCQUFLLEdBQVosVUFBYSxJQUFXLEVBQUUsT0FBYztRQUN0QyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNsQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUNILGVBQUM7QUFBRCxDQUFDLEFBWkQsQ0FBOEIsY0FBSyxHQVlsQztBQVpZLDRCQUFRIn0=