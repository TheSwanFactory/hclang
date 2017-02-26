"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
exports.ender = function (source, parameter) {
    var pipe = source;
    return pipe.finish();
};
var LexTerminal = (function (_super) {
    __extends(LexTerminal, _super);
    function LexTerminal(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        _this.callme = true;
        return _this;
    }
    LexTerminal.end = function () { return new LexTerminal(exports.ender); };
    ;
    LexTerminal.prototype.apply = function (argument, parameter) {
        return this.data(argument, parameter);
    };
    LexTerminal.prototype.toData = function () { return this.data; };
    return LexTerminal;
}(frames_1.Frame));
exports.LexTerminal = LexTerminal;
var LexSpace = (function (_super) {
    __extends(LexSpace, _super);
    function LexSpace() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LexSpace.prototype.isEnd = function (char) { return char !== " "; };
    LexSpace.prototype.makeFrame = function () { return frames_1.FrameSymbol.for(""); };
    return LexSpace;
}(lex_1.Lex));
exports.LexSpace = LexSpace;
;
exports.terminals = {
    " ": new LexSpace(),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdGVybWluYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUEyRTtBQUUzRSw2QkFBNEI7QUFHZixRQUFBLEtBQUssR0FBbUIsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7SUFDbkUsSUFBTSxJQUFJLEdBQUcsTUFBaUIsQ0FBQztJQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUVGO0lBQWlDLCtCQUFLO0lBR3BDLHFCQUFzQixJQUFvQjtRQUExQyxZQUNFLGtCQUFNLGFBQUksQ0FBQyxTQUVaO1FBSHFCLFVBQUksR0FBSixJQUFJLENBQWdCO1FBRXhDLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDOztJQUNyQixDQUFDO0lBTGEsZUFBRyxHQUFqQixjQUFzQixNQUFNLENBQUMsSUFBSSxXQUFXLENBQUMsYUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQU9oRCwyQkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRVMsNEJBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLGtCQUFDO0FBQUQsQ0FBQyxBQWJELENBQWlDLGNBQUssR0FhckM7QUFiWSxrQ0FBVztBQWV4QjtJQUE4Qiw0QkFBRztJQUFqQzs7SUFJQSxDQUFDO0lBSFcsd0JBQUssR0FBZixVQUFnQixJQUFZLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTVDLDRCQUFTLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxvQkFBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQsZUFBQztBQUFELENBQUMsQUFKRCxDQUE4QixTQUFHLEdBSWhDO0FBSlksNEJBQVE7QUFJcEIsQ0FBQztBQUVXLFFBQUEsU0FBUyxHQUFZO0lBQ2hDLEdBQUcsRUFBRSxJQUFJLFFBQVEsRUFBRTtDQUNwQixDQUFDIn0=