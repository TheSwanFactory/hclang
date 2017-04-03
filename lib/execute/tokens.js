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
var lex_1 = require("./lex");
var Token = (function (_super) {
    __extends(Token, _super);
    function Token(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        return _this;
    }
    Token.prototype.called_by = function (callee, parameter) {
        return callee.apply(this.data, parameter);
    };
    Token.prototype.toData = function () { return this.data; };
    return Token;
}(frames_1.FrameAtom));
exports.Token = Token;
var LexQuote = (function (_super) {
    __extends(LexQuote, _super);
    function LexQuote() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LexQuote.prototype.isQuoting = function () {
        return true;
    };
    return LexQuote;
}(lex_1.Lex));
exports.LexQuote = LexQuote;
;
var LexString = (function (_super) {
    __extends(LexString, _super);
    function LexString() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LexString.prototype.isEnd = function (char) {
        return char === "”";
    };
    LexString.prototype.makeFrame = function () {
        var frame = new frames_1.FrameString(this.body);
        return new Token(frame);
    };
    return LexString;
}(LexQuote));
exports.LexString = LexString;
;
var LexComment = (function (_super) {
    __extends(LexComment, _super);
    function LexComment() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LexComment.prototype.isEnd = function (char) { return char === frames_1.FrameComment.COMMENT_END; };
    LexComment.prototype.makeFrame = function () {
        var frame = new frames_1.FrameComment(this.body);
        return new Token(frame);
    };
    return LexComment;
}(lex_1.Lex));
exports.LexComment = LexComment;
;
var LexSpace = (function (_super) {
    __extends(LexSpace, _super);
    function LexSpace() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LexSpace.prototype.isEnd = function (char) {
        this.pass_on = true;
        return char !== " ";
    };
    LexSpace.prototype.makeFrame = function () { return frames_1.Frame.nil; };
    return LexSpace;
}(lex_1.Lex));
exports.LexSpace = LexSpace;
;
exports.tokens = {
    " ": new LexSpace(),
    "#": new LexComment(),
    "“": new LexString(),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFvRztBQUNwRyw2QkFBNEI7QUFFNUI7SUFBMkIseUJBQVM7SUFDbEMsZUFBc0IsSUFBVztRQUFqQyxZQUNFLGtCQUFNLGFBQUksQ0FBQyxTQUNaO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQU87O0lBRWpDLENBQUM7SUFFTSx5QkFBUyxHQUFoQixVQUFpQixNQUFhLEVBQUUsU0FBZ0I7UUFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ1Msc0JBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLFlBQUM7QUFBRCxDQUFDLEFBVEQsQ0FBMkIsa0JBQVMsR0FTbkM7QUFUWSxzQkFBSztBQVdsQjtJQUE4Qiw0QkFBRztJQUFqQzs7SUFJQSxDQUFDO0lBSFcsNEJBQVMsR0FBbkI7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNILGVBQUM7QUFBRCxDQUFDLEFBSkQsQ0FBOEIsU0FBRyxHQUloQztBQUpZLDRCQUFRO0FBSXBCLENBQUM7QUFFRjtJQUErQiw2QkFBUTtJQUF2Qzs7SUFTQSxDQUFDO0lBUlcseUJBQUssR0FBZixVQUFnQixJQUFZO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO0lBQ3RCLENBQUM7SUFFUyw2QkFBUyxHQUFuQjtRQUNFLElBQU0sS0FBSyxHQUFHLElBQUksb0JBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFURCxDQUErQixRQUFRLEdBU3RDO0FBVFksOEJBQVM7QUFTckIsQ0FBQztBQUVGO0lBQWdDLDhCQUFHO0lBQW5DOztJQU9BLENBQUM7SUFOVywwQkFBSyxHQUFmLFVBQWdCLElBQVksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLHFCQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUVqRSw4QkFBUyxHQUFuQjtRQUNFLElBQU0sS0FBSyxHQUFHLElBQUkscUJBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDSCxpQkFBQztBQUFELENBQUMsQUFQRCxDQUFnQyxTQUFHLEdBT2xDO0FBUFksZ0NBQVU7QUFPdEIsQ0FBQztBQUVGO0lBQThCLDRCQUFHO0lBQWpDOztJQU9BLENBQUM7SUFOVyx3QkFBSyxHQUFmLFVBQWdCLElBQVk7UUFDMUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUVTLDRCQUFTLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxjQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM3QyxlQUFDO0FBQUQsQ0FBQyxBQVBELENBQThCLFNBQUcsR0FPaEM7QUFQWSw0QkFBUTtBQU9wQixDQUFDO0FBRVcsUUFBQSxNQUFNLEdBQVk7SUFDOUIsR0FBRyxFQUFFLElBQUksUUFBUSxFQUFFO0lBQ25CLEdBQUcsRUFBRSxJQUFJLFVBQVUsRUFBRTtJQUNyQixHQUFHLEVBQUUsSUFBSSxTQUFTLEVBQUU7Q0FDcEIsQ0FBQyJ9