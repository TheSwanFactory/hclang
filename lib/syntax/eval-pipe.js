"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbC1waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N5bnRheC9ldmFsLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0NBQWtHO0FBSWxHO0lBQThCLDRCQUFLO0lBQ2pDLGtCQUFZLEdBQVUsRUFBRSxJQUFvQjtRQUFwQixxQkFBQSxFQUFBLG9CQUFvQjtRQUE1QyxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUVaO1FBREMsS0FBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDOztJQUM1QixDQUFDO0lBRU0sd0JBQUssR0FBWixVQUFhLElBQVcsRUFBRSxPQUFjO1FBQ3RDLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakIsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUFaRCxDQUE4QixjQUFLLEdBWWxDO0FBWlksNEJBQVEifQ==