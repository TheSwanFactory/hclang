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
var LexString = (function (_super) {
    __extends(LexString, _super);
    function LexString() {
        return _super.call(this, frames_1.FrameString, { isQuote: true }) || this;
    }
    LexString.prototype.isEnd = function (char) {
        return char === "”";
    };
    return LexString;
}(lex_1.Lex));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFvRztBQUNwRyw2QkFBNEI7QUFFNUI7SUFBK0IsNkJBQUc7SUFDaEM7ZUFDRSxrQkFBTSxvQkFBVyxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDO0lBQ3JDLENBQUM7SUFFUyx5QkFBSyxHQUFmLFVBQWdCLElBQVk7UUFDMUIsTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQVJELENBQStCLFNBQUcsR0FRakM7QUFSWSw4QkFBUztBQVFyQixDQUFDO0FBRUY7SUFBZ0MsOEJBQUc7SUFDakM7ZUFDRSxrQkFBTSxxQkFBWSxDQUFDO0lBQ3JCLENBQUM7SUFFUywwQkFBSyxHQUFmLFVBQWdCLElBQVksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLHFCQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUM3RSxpQkFBQztBQUFELENBQUMsQUFORCxDQUFnQyxTQUFHLEdBTWxDO0FBTlksZ0NBQVU7QUFNdEIsQ0FBQztBQUVGO0lBQThCLDRCQUFHO0lBQy9CO2VBQ0Usa0JBQU0sY0FBSyxDQUFDLEdBQUcsQ0FBQztJQUNsQixDQUFDO0lBRVMsd0JBQUssR0FBZixVQUFnQixJQUFZO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO0lBQ3RCLENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQVRELENBQThCLFNBQUcsR0FTaEM7QUFUWSw0QkFBUTtBQVNwQixDQUFDO0FBRVcsUUFBQSxNQUFNLEdBQVk7SUFDOUIsR0FBRyxFQUFFLElBQUksUUFBUSxFQUFFO0lBQ25CLEdBQUcsRUFBRSxJQUFJLFVBQVUsRUFBRTtJQUNyQixHQUFHLEVBQUUsSUFBSSxTQUFTLEVBQUU7Q0FDcEIsQ0FBQyJ9