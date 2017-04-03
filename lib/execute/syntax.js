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
    " ": new LexSpace(),
    "#": new lex_1.Lex(frame.FrameComment),
    "“": new lex_1.Lex(frame.FrameString, { isQuote: true }),
};
_.merge(tokens, terminals_1.terminals);
exports.syntax = tokens;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QixpQ0FBbUM7QUFDbkMsNkJBQTRCO0FBQzVCLHlDQUFrRDtBQUVsRDtJQUE4Qiw0QkFBRztJQUMvQjtlQUNFLGtCQUFNLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ3hCLENBQUM7SUFFUyx3QkFBSyxHQUFmLFVBQWdCLElBQVk7UUFDMUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUNILGVBQUM7QUFBRCxDQUFDLEFBVEQsQ0FBOEIsU0FBRyxHQVNoQztBQVRZLDRCQUFRO0FBU3BCLENBQUM7QUFFRixJQUFNLE1BQU0sR0FBa0I7SUFDN0IsR0FBRyxFQUFFLElBQUksUUFBUSxFQUFFO0lBQ25CLEdBQUcsRUFBRSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBQ2hDLEdBQUcsRUFBRSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDO0NBQ2hELENBQUM7QUFFRixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxxQkFBUyxDQUFDLENBQUM7QUFFZCxRQUFBLE1BQU0sR0FBa0IsTUFBTSxDQUFDIn0=