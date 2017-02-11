"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var LexString = (function (_super) {
    __extends(LexString, _super);
    function LexString() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LexString.prototype.isEnd = function (char) {
        return char === "”";
    };
    LexString.prototype.makeFrame = function () {
        return new frames_1.FrameString(this.body);
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
    LexComment.prototype.makeFrame = function () { return frames_1.FrameSymbol.for(""); };
    return LexComment;
}(lex_1.Lex));
exports.LexComment = LexComment;
;
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
exports.tokens = {
    " ": new LexSpace(),
    "#": new LexComment(),
    "“": new LexString(),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2xkX3Rva2Vucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zeW50YXgvb2xkX3Rva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvQ0FBcUU7QUFDckUsNkJBQTRCO0FBRTVCO0lBQStCLDZCQUFHO0lBQWxDOztJQVFBLENBQUM7SUFQVyx5QkFBSyxHQUFmLFVBQWdCLElBQVk7UUFDMUIsTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUVTLDZCQUFTLEdBQW5CO1FBQ0UsTUFBTSxDQUFDLElBQUksb0JBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQVJELENBQStCLFNBQUcsR0FRakM7QUFSWSw4QkFBUztBQVFyQixDQUFDO0FBRUY7SUFBZ0MsOEJBQUc7SUFBbkM7O0lBSUEsQ0FBQztJQUhXLDBCQUFLLEdBQWYsVUFBZ0IsSUFBWSxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRTdELDhCQUFTLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxvQkFBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQsaUJBQUM7QUFBRCxDQUFDLEFBSkQsQ0FBZ0MsU0FBRyxHQUlsQztBQUpZLGdDQUFVO0FBSXRCLENBQUM7QUFFRjtJQUE4Qiw0QkFBRztJQUFqQzs7SUFJQSxDQUFDO0lBSFcsd0JBQUssR0FBZixVQUFnQixJQUFZLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTVDLDRCQUFTLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxvQkFBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQsZUFBQztBQUFELENBQUMsQUFKRCxDQUE4QixTQUFHLEdBSWhDO0FBSlksNEJBQVE7QUFJcEIsQ0FBQztBQUVXLFFBQUEsTUFBTSxHQUFZO0lBQzdCLEdBQUcsRUFBRSxJQUFJLFFBQVEsRUFBRTtJQUNuQixHQUFHLEVBQUUsSUFBSSxVQUFVLEVBQUU7SUFDckIsR0FBRyxFQUFFLElBQUksU0FBUyxFQUFFO0NBQ3JCLENBQUMifQ==