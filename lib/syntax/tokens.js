"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var parse_1 = require("./parse");
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
        return new parse_1.ParseToken(frame);
    };
    return LexString;
}(lex_1.Lex));
exports.LexString = LexString;
;
var LexComment = (function (_super) {
    __extends(LexComment, _super);
    function LexComment() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LexComment.prototype.isEnd = function (char) { return char === "#" || char === "\n"; };
    LexComment.prototype.makeFrame = function () {
        var frame = frames_1.FrameSymbol.for("");
        return new parse_1.ParseToken(frame);
    };
    return LexComment;
}(lex_1.Lex));
exports.LexComment = LexComment;
;
exports.tokens = {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N5bnRheC90b2tlbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0NBQXFFO0FBQ3JFLDZCQUE0QjtBQUM1QixpQ0FBcUM7QUFFckM7SUFBK0IsNkJBQUc7SUFBbEM7O0lBU0EsQ0FBQztJQVJXLHlCQUFLLEdBQWYsVUFBZ0IsSUFBWTtRQUMxQixNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztJQUN0QixDQUFDO0lBRVMsNkJBQVMsR0FBbkI7UUFDRSxJQUFNLEtBQUssR0FBRyxJQUFJLG9CQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxJQUFJLGtCQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQVRELENBQStCLFNBQUcsR0FTakM7QUFUWSw4QkFBUztBQVNyQixDQUFDO0FBRUY7SUFBZ0MsOEJBQUc7SUFBbkM7O0lBT0EsQ0FBQztJQU5XLDBCQUFLLEdBQWYsVUFBZ0IsSUFBWSxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRTdELDhCQUFTLEdBQW5CO1FBQ0UsSUFBTSxLQUFLLEdBQUcsb0JBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLElBQUksa0JBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBUEQsQ0FBZ0MsU0FBRyxHQU9sQztBQVBZLGdDQUFVO0FBT3RCLENBQUM7QUFFVyxRQUFBLE1BQU0sR0FBWSxFQUc5QixDQUFDIn0=