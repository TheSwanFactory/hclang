"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var parse_1 = require("./parse");
var EvalPipe = (function (_super) {
    __extends(EvalPipe, _super);
    function EvalPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.set(parse_1.ParsePipe.kOUT, out);
        return _this;
    }
    return EvalPipe;
}(frames_1.Frame));
exports.EvalPipe = EvalPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbC1waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N5bnRheC9ldmFsLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0NBQWtHO0FBRWxHLGlDQUFvQztBQUVwQztJQUE4Qiw0QkFBSztJQUNqQyxrQkFBWSxHQUFVLEVBQUUsSUFBb0I7UUFBcEIscUJBQUEsRUFBQSxvQkFBb0I7UUFBNUMsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FFWjtRQURDLEtBQUksQ0FBQyxHQUFHLENBQUMsaUJBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7O0lBQ2hDLENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQUxELENBQThCLGNBQUssR0FLbEM7QUFMWSw0QkFBUSJ9