"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
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
        return new ParseToken(frame);
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
        var frame = frames_1.Frame.nil;
        return new ParseToken(frame);
    };
    return LexComment;
}(lex_1.Lex));
exports.LexComment = LexComment;
;
exports.tokens = {
    "#": new LexComment(),
    "“": new LexString(),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUFzRjtBQUN0Riw2QkFBNEI7QUFFNUI7SUFBZ0MsOEJBQVM7SUFDdkMsb0JBQXNCLElBQVc7UUFBakMsWUFDRSxrQkFBTSxhQUFJLENBQUMsU0FDWjtRQUZxQixVQUFJLEdBQUosSUFBSSxDQUFPOztJQUVqQyxDQUFDO0lBRU0sOEJBQVMsR0FBaEIsVUFBaUIsTUFBYSxFQUFFLFNBQWdCO1FBQzlDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNTLDJCQUFNLEdBQWhCLGNBQTBCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvQyxpQkFBQztBQUFELENBQUMsQUFURCxDQUFnQyxrQkFBUyxHQVN4QztBQVRZLGdDQUFVO0FBV3ZCO0lBQStCLDZCQUFHO0lBQWxDOztJQVNBLENBQUM7SUFSVyx5QkFBSyxHQUFmLFVBQWdCLElBQVk7UUFDMUIsTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUVTLDZCQUFTLEdBQW5CO1FBQ0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQVRELENBQStCLFNBQUcsR0FTakM7QUFUWSw4QkFBUztBQVNyQixDQUFDO0FBRUY7SUFBZ0MsOEJBQUc7SUFBbkM7O0lBT0EsQ0FBQztJQU5XLDBCQUFLLEdBQWYsVUFBZ0IsSUFBWSxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRTdELDhCQUFTLEdBQW5CO1FBQ0UsSUFBTSxLQUFLLEdBQUcsY0FBSyxDQUFDLEdBQUcsQ0FBQztRQUN4QixNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQVBELENBQWdDLFNBQUcsR0FPbEM7QUFQWSxnQ0FBVTtBQU90QixDQUFDO0FBRVcsUUFBQSxNQUFNLEdBQVk7SUFDOUIsR0FBRyxFQUFFLElBQUksVUFBVSxFQUFFO0lBQ3JCLEdBQUcsRUFBRSxJQUFJLFNBQVMsRUFBRTtDQUNwQixDQUFDIn0=