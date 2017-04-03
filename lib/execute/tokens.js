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
    return LexComment;
}(lex_1.Lex));
exports.LexComment = LexComment;
;
var LexSpace = (function (_super) {
    __extends(LexSpace, _super);
    function LexSpace() {
        return _super.call(this, frames_1.Frame.nil) || this;
    }
    LexSpace.prototype.isEnd = function (char) {
        this.pass_on = true;
        return char !== " ";
    };
    return LexSpace;
}(lex_1.Lex));
exports.LexSpace = LexSpace;
;
exports.tokens = {
    " ": new LexSpace(),
    "#": new LexComment(),
    "“": new LexString(),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFvRztBQUNwRyw2QkFBNEI7QUFFNUI7SUFBOEIsNEJBQUc7SUFDL0Isa0JBQXNCLE9BQVk7ZUFDaEMsa0JBQU0sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFDUyw0QkFBUyxHQUFuQjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUFQRCxDQUE4QixTQUFHLEdBT2hDO0FBUFksNEJBQVE7QUFPcEIsQ0FBQztBQUVGO0lBQStCLDZCQUFRO0lBQ3JDO2VBQ0Usa0JBQU0sb0JBQVcsQ0FBQztJQUNwQixDQUFDO0lBRVMseUJBQUssR0FBZixVQUFnQixJQUFZO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO0lBQ3RCLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFSRCxDQUErQixRQUFRLEdBUXRDO0FBUlksOEJBQVM7QUFRckIsQ0FBQztBQUVGO0lBQWdDLDhCQUFHO0lBQ2pDO2VBQ0Usa0JBQU0scUJBQVksQ0FBQztJQUNyQixDQUFDO0lBRVMsMEJBQUssR0FBZixVQUFnQixJQUFZLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxxQkFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDN0UsaUJBQUM7QUFBRCxDQUFDLEFBTkQsQ0FBZ0MsU0FBRyxHQU1sQztBQU5ZLGdDQUFVO0FBTXRCLENBQUM7QUFFRjtJQUE4Qiw0QkFBRztJQUMvQjtlQUNFLGtCQUFNLGNBQUssQ0FBQyxHQUFHLENBQUM7SUFDbEIsQ0FBQztJQUVTLHdCQUFLLEdBQWYsVUFBZ0IsSUFBWTtRQUMxQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztJQUN0QixDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUFURCxDQUE4QixTQUFHLEdBU2hDO0FBVFksNEJBQVE7QUFTcEIsQ0FBQztBQUVXLFFBQUEsTUFBTSxHQUFZO0lBQzlCLEdBQUcsRUFBRSxJQUFJLFFBQVEsRUFBRTtJQUNuQixHQUFHLEVBQUUsSUFBSSxVQUFVLEVBQUU7SUFDckIsR0FBRyxFQUFFLElBQUksU0FBUyxFQUFFO0NBQ3BCLENBQUMifQ==