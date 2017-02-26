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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9wYXJzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvQ0FBbUY7QUFFbkYseUNBQTBDO0FBRTdCLFFBQUEsS0FBSyxHQUFtQixVQUFDLE1BQWEsRUFBRSxTQUFnQjtJQUNuRSxJQUFNLElBQUksR0FBRyxNQUFtQixDQUFDO0lBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDdkIsQ0FBQyxDQUFDO0FBRUY7SUFBK0IsNkJBQVU7SUFFdkMsbUJBQVksR0FBVTtRQUF0QixpQkFLQztRQUpDLElBQU0sSUFBSSxHQUFZLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUMzQixJQUFJLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksdUJBQVcsQ0FBQyxhQUFLLENBQUMsQ0FBQztRQUMxQyxRQUFBLGtCQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBQzs7SUFDbEIsQ0FBQztJQUVNLDBCQUFNLEdBQWI7UUFDRSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDL0IsSUFBTSxJQUFJLEdBQUcsSUFBSSxrQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDZixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQWhCRCxDQUErQixtQkFBVSxHQWdCeEM7QUFoQlksOEJBQVM7QUFrQnRCO0lBQWdDLDhCQUFTO0lBQ3ZDLG9CQUFzQixJQUFXO1FBQWpDLFlBQ0Usa0JBQU0sYUFBSSxDQUFDLFNBQ1o7UUFGcUIsVUFBSSxHQUFKLElBQUksQ0FBTzs7SUFFakMsQ0FBQztJQUVNLDhCQUFTLEdBQWhCLFVBQWlCLE1BQWEsRUFBRSxTQUFnQjtRQUM5QyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDUywyQkFBTSxHQUFoQixjQUEwQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0MsaUJBQUM7QUFBRCxDQUFDLEFBVEQsQ0FBZ0Msa0JBQVMsR0FTeEM7QUFUWSxnQ0FBVSJ9