"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
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
var ParseTerminal = (function (_super) {
    __extends(ParseTerminal, _super);
    function ParseTerminal(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        return _this;
    }
    ParseTerminal.prototype.called_by = function (callee, parameter) {
        return this.data.call(callee, parameter);
    };
    ParseTerminal.prototype.toData = function () { return this.data; };
    return ParseTerminal;
}(frames_1.Frame));
exports.ParseTerminal = ParseTerminal;
var ParsePipe = (function (_super) {
    __extends(ParsePipe, _super);
    function ParsePipe(out) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.set(ParsePipe.kOUT, out);
        _this.data = new frames_1.FrameArray([]);
        return _this;
    }
    return ParsePipe;
}(frames_1.Frame));
exports.ParsePipe = ParsePipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3ludGF4L3BhcnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUFxRjtBQUdyRjtJQUFnQyw4QkFBUztJQUN2QyxvQkFBc0IsSUFBVztRQUFqQyxZQUNFLGtCQUFNLGFBQUksQ0FBQyxTQUNaO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQU87O0lBRWpDLENBQUM7SUFFTSw4QkFBUyxHQUFoQixVQUFpQixNQUFhLEVBQUUsU0FBZ0I7UUFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ1MsMkJBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLGlCQUFDO0FBQUQsQ0FBQyxBQVRELENBQWdDLGtCQUFTLEdBU3hDO0FBVFksZ0NBQVU7QUFXdkI7SUFBbUMsaUNBQUs7SUFDdEMsdUJBQXNCLElBQW9CO1FBQTFDLFlBQ0Usa0JBQU0sYUFBSSxDQUFDLFNBQ1o7UUFGcUIsVUFBSSxHQUFKLElBQUksQ0FBZ0I7O0lBRTFDLENBQUM7SUFFTSxpQ0FBUyxHQUFoQixVQUFpQixNQUFhLEVBQUUsU0FBZ0I7UUFDOUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRVMsOEJBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLG9CQUFDO0FBQUQsQ0FBQyxBQVZELENBQW1DLGNBQUssR0FVdkM7QUFWWSxzQ0FBYTtBQVkxQjtJQUErQiw2QkFBSztJQUVsQyxtQkFBWSxHQUFVO1FBQXRCLFlBQ0Usa0JBQU0sYUFBSSxDQUFDLFNBR1o7UUFGQyxLQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUIsS0FBSSxDQUFDLElBQUksR0FBRyxJQUFJLG1CQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7O0lBQ2pDLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFQRCxDQUErQixjQUFLLEdBT25DO0FBUFksOEJBQVMifQ==