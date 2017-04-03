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
    function LexQuote(factory) {
        return _super.call(this, factory) || this;
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
        return _super.call(this, frames_1.FrameString) || this;
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
        return _super.call(this, frames_1.FrameComment) || this;
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
        return _super.call(this, frames_1.FrameString) || this;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFvRztBQUNwRyw2QkFBNEI7QUFFNUI7SUFBMkIseUJBQVM7SUFDbEMsZUFBc0IsSUFBVztRQUFqQyxZQUNFLGtCQUFNLGFBQUksQ0FBQyxTQUNaO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQU87O0lBRWpDLENBQUM7SUFFTSx5QkFBUyxHQUFoQixVQUFpQixNQUFhLEVBQUUsU0FBZ0I7UUFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ1Msc0JBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLFlBQUM7QUFBRCxDQUFDLEFBVEQsQ0FBMkIsa0JBQVMsR0FTbkM7QUFUWSxzQkFBSztBQVdsQjtJQUE4Qiw0QkFBRztJQUMvQixrQkFBc0IsT0FBWTtlQUNoQyxrQkFBTSxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUNTLDRCQUFTLEdBQW5CO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQVBELENBQThCLFNBQUcsR0FPaEM7QUFQWSw0QkFBUTtBQU9wQixDQUFDO0FBRUY7SUFBK0IsNkJBQVE7SUFDckM7ZUFDRSxrQkFBTSxvQkFBVyxDQUFDO0lBQ3BCLENBQUM7SUFFUyx5QkFBSyxHQUFmLFVBQWdCLElBQVk7UUFDMUIsTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUVTLDZCQUFTLEdBQW5CO1FBQ0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQWJELENBQStCLFFBQVEsR0FhdEM7QUFiWSw4QkFBUztBQWFyQixDQUFDO0FBRUY7SUFBZ0MsOEJBQUc7SUFDakM7ZUFDRSxrQkFBTSxxQkFBWSxDQUFDO0lBQ3JCLENBQUM7SUFFUywwQkFBSyxHQUFmLFVBQWdCLElBQVksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLHFCQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUVqRSw4QkFBUyxHQUFuQjtRQUNFLElBQU0sS0FBSyxHQUFHLElBQUkscUJBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDSCxpQkFBQztBQUFELENBQUMsQUFYRCxDQUFnQyxTQUFHLEdBV2xDO0FBWFksZ0NBQVU7QUFXdEIsQ0FBQztBQUVGO0lBQThCLDRCQUFHO0lBQy9CO2VBQ0Usa0JBQU0sb0JBQVcsQ0FBQztJQUNwQixDQUFDO0lBRVMsd0JBQUssR0FBZixVQUFnQixJQUFZO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO0lBQ3RCLENBQUM7SUFFUyw0QkFBUyxHQUFuQixjQUF3QixNQUFNLENBQUMsY0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDN0MsZUFBQztBQUFELENBQUMsQUFYRCxDQUE4QixTQUFHLEdBV2hDO0FBWFksNEJBQVE7QUFXcEIsQ0FBQztBQUVXLFFBQUEsTUFBTSxHQUFZO0lBQzlCLEdBQUcsRUFBRSxJQUFJLFFBQVEsRUFBRTtJQUNuQixHQUFHLEVBQUUsSUFBSSxVQUFVLEVBQUU7SUFDckIsR0FBRyxFQUFFLElBQUksU0FBUyxFQUFFO0NBQ3BCLENBQUMifQ==