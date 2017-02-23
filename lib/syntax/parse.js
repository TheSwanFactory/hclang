"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var terminals_1 = require("./terminals");
exports.ender = function (source, parameter) {
    var pipe = source;
    return pipe.finish();
};
var ParsePipe = (function (_super) {
    __extends(ParsePipe, _super);
    function ParsePipe(out) {
        var _this = this;
        var meta = {};
        meta[ParsePipe.kOUT] = out;
        meta[frames_1.Frame.kEND] = new terminals_1.LexTerminal(exports.ender);
        _this = _super.call(this, meta) || this;
        _this.data = new frames_1.FrameArray([]);
        return _this;
    }
    ParsePipe.prototype.finish = function () {
        var current = this.data.asArray();
        var expr = new frames_1.FrameExpr(current);
        var out = this.get(frames_1.Frame.kOUT);
        out.call(expr);
        return expr;
    };
    return ParsePipe;
}(frames_1.Frame));
exports.ParsePipe = ParsePipe;
var ParseToken = (function (_super) {
    __extends(ParseToken, _super);
    function ParseToken(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        return _this;
    }
    ParseToken.prototype.called_by = function (callee, parameter) {
        return callee.apply(this.data, parameter);
    };
    ParseToken.prototype.toData = function () { return this.data; };
    return ParseToken;
}(frames_1.FrameAtom));
exports.ParseToken = ParseToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3ludGF4L3BhcnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUFtRjtBQUVuRix5Q0FBMEM7QUFFN0IsUUFBQSxLQUFLLEdBQW1CLFVBQUMsTUFBYSxFQUFFLFNBQWdCO0lBQ25FLElBQU0sSUFBSSxHQUFHLE1BQW1CLENBQUM7SUFDakMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFFRjtJQUErQiw2QkFBSztJQUdsQyxtQkFBWSxHQUFVO1FBQXRCLGlCQU1DO1FBTEMsSUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSx1QkFBVyxDQUFDLGFBQUssQ0FBQyxDQUFDO1FBQzFDLFFBQUEsa0JBQU0sSUFBSSxDQUFDLFNBQUM7UUFDWixLQUFJLENBQUMsSUFBSSxHQUFHLElBQUksbUJBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7SUFDakMsQ0FBQztJQUVNLDBCQUFNLEdBQWI7UUFFRSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BDLElBQU0sSUFBSSxHQUFHLElBQUksa0JBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFuQkQsQ0FBK0IsY0FBSyxHQW1CbkM7QUFuQlksOEJBQVM7QUFxQnRCO0lBQWdDLDhCQUFTO0lBQ3ZDLG9CQUFzQixJQUFXO1FBQWpDLFlBQ0Usa0JBQU0sYUFBSSxDQUFDLFNBQ1o7UUFGcUIsVUFBSSxHQUFKLElBQUksQ0FBTzs7SUFFakMsQ0FBQztJQUVNLDhCQUFTLEdBQWhCLFVBQWlCLE1BQWEsRUFBRSxTQUFnQjtRQUU5QyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDUywyQkFBTSxHQUFoQixjQUEwQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0MsaUJBQUM7QUFBRCxDQUFDLEFBVkQsQ0FBZ0Msa0JBQVMsR0FVeEM7QUFWWSxnQ0FBVSJ9