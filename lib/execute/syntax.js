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
var _ = require("lodash");
var frame = require("../frames");
var lex_1 = require("./lex");
var terminals_1 = require("./terminals");
var FrameSpace = (function (_super) {
    __extends(FrameSpace, _super);
    function FrameSpace() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FrameSpace.prototype.canInclude = function (char) {
        return char === "";
    };
    FrameSpace.prototype.isVoid = function () {
        return true;
    };
    return FrameSpace;
}(frame.Frame));
exports.FrameSpace = FrameSpace;
;
var LexSpace = (function (_super) {
    __extends(LexSpace, _super);
    function LexSpace() {
        return _super.call(this, frame.Frame.nil) || this;
    }
    LexSpace.prototype.isEnd = function (char) {
        this.pass_on = true;
        return char !== " ";
    };
    return LexSpace;
}(lex_1.Lex));
exports.LexSpace = LexSpace;
;
var tokens = {
    " ": new lex_1.Lex(FrameSpace),
    "#": new lex_1.Lex(frame.FrameComment),
    "“": new lex_1.Lex(frame.FrameString, { isQuote: true }),
};
_.merge(tokens, terminals_1.terminals);
exports.syntax = tokens;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QixpQ0FBbUM7QUFDbkMsNkJBQTRCO0FBQzVCLHlDQUFrRDtBQUVsRDtJQUFnQyw4QkFBVztJQUEzQzs7SUFPQSxDQUFDO0lBTlEsK0JBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUM1QixNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBQ00sMkJBQU0sR0FBYjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBUEQsQ0FBZ0MsS0FBSyxDQUFDLEtBQUssR0FPMUM7QUFQWSxnQ0FBVTtBQU90QixDQUFDO0FBRUY7SUFBOEIsNEJBQUc7SUFDL0I7ZUFDRSxrQkFBTSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUN4QixDQUFDO0lBRVMsd0JBQUssR0FBZixVQUFnQixJQUFZO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO0lBQ3RCLENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQVRELENBQThCLFNBQUcsR0FTaEM7QUFUWSw0QkFBUTtBQVNwQixDQUFDO0FBRUYsSUFBTSxNQUFNLEdBQWtCO0lBQzdCLEdBQUcsRUFBRSxJQUFJLFNBQUcsQ0FBQyxVQUFVLENBQUM7SUFDeEIsR0FBRyxFQUFFLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7SUFDaEMsR0FBRyxFQUFFLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUM7Q0FDaEQsQ0FBQztBQUVGLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLHFCQUFTLENBQUMsQ0FBQztBQUVkLFFBQUEsTUFBTSxHQUFrQixNQUFNLENBQUMifQ==