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
        _this = _super.call(this, [], meta) || this;
        return _this;
    }
    ParsePipe.prototype.finish = function () {
        var current = this.asArray();
        var expr = new frames_1.FrameExpr(current);
        var out = this.get(frames_1.Frame.kOUT);
        out.call(expr);
        return expr;
    };
    return ParsePipe;
}(frames_1.FrameArray));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3ludGF4L3BhcnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUFtRjtBQUVuRix5Q0FBMEM7QUFFN0IsUUFBQSxLQUFLLEdBQW1CLFVBQUMsTUFBYSxFQUFFLFNBQWdCO0lBQ25FLElBQU0sSUFBSSxHQUFHLE1BQW1CLENBQUM7SUFDakMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFFRjtJQUErQiw2QkFBVTtJQUV2QyxtQkFBWSxHQUFVO1FBQXRCLGlCQUtDO1FBSkMsSUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSx1QkFBVyxDQUFDLGFBQUssQ0FBQyxDQUFDO1FBQzFDLFFBQUEsa0JBQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFDOztJQUNsQixDQUFDO0lBRU0sMEJBQU0sR0FBYjtRQUNFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvQixJQUFNLElBQUksR0FBRyxJQUFJLGtCQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBaEJELENBQStCLG1CQUFVLEdBZ0J4QztBQWhCWSw4QkFBUztBQWtCdEI7SUFBZ0MsOEJBQVM7SUFDdkMsb0JBQXNCLElBQVc7UUFBakMsWUFDRSxrQkFBTSxhQUFJLENBQUMsU0FDWjtRQUZxQixVQUFJLEdBQUosSUFBSSxDQUFPOztJQUVqQyxDQUFDO0lBRU0sOEJBQVMsR0FBaEIsVUFBaUIsTUFBYSxFQUFFLFNBQWdCO1FBQzlDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNTLDJCQUFNLEdBQWhCLGNBQTBCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvQyxpQkFBQztBQUFELENBQUMsQUFURCxDQUFnQyxrQkFBUyxHQVN4QztBQVRZLGdDQUFVIn0=