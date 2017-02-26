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
        var frame = frames_1.Frame.nil;
        return new parse_1.ParseToken(frame);
    };
    return LexComment;
}(lex_1.Lex));
exports.LexComment = LexComment;
;
exports.tokens = {
    "#": new LexComment(),
    "“": new LexString(),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUFxRTtBQUNyRSw2QkFBNEI7QUFDNUIsaUNBQXFDO0FBRXJDO0lBQStCLDZCQUFHO0lBQWxDOztJQVNBLENBQUM7SUFSVyx5QkFBSyxHQUFmLFVBQWdCLElBQVk7UUFDMUIsTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUVTLDZCQUFTLEdBQW5CO1FBQ0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsSUFBSSxrQkFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFURCxDQUErQixTQUFHLEdBU2pDO0FBVFksOEJBQVM7QUFTckIsQ0FBQztBQUVGO0lBQWdDLDhCQUFHO0lBQW5DOztJQU9BLENBQUM7SUFOVywwQkFBSyxHQUFmLFVBQWdCLElBQVksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztJQUU3RCw4QkFBUyxHQUFuQjtRQUNFLElBQU0sS0FBSyxHQUFHLGNBQUssQ0FBQyxHQUFHLENBQUM7UUFDeEIsTUFBTSxDQUFDLElBQUksa0JBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBUEQsQ0FBZ0MsU0FBRyxHQU9sQztBQVBZLGdDQUFVO0FBT3RCLENBQUM7QUFFVyxRQUFBLE1BQU0sR0FBWTtJQUM5QixHQUFHLEVBQUUsSUFBSSxVQUFVLEVBQUU7SUFDckIsR0FBRyxFQUFFLElBQUksU0FBUyxFQUFFO0NBQ3BCLENBQUMifQ==