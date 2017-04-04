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
var frame_1 = require("./frame");
var FrameComment = (function (_super) {
    __extends(FrameComment, _super);
    function FrameComment(data, meta) {
        if (meta === void 0) { meta = frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        return _this;
    }
    FrameComment.prototype.is_void = function () { return true; };
    ;
    FrameComment.prototype.string_prefix = function () { return FrameComment.COMMENT_BEGIN; };
    ;
    FrameComment.prototype.string_suffix = function () { return FrameComment.COMMENT_END; };
    ;
    FrameComment.prototype.toData = function () { return this.data; };
    return FrameComment;
}(frame_1.FrameAtom));
FrameComment.COMMENT_BEGIN = "#";
FrameComment.COMMENT_END = "#";
exports.FrameComment = FrameComment;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBZ0U7QUFFaEU7SUFBa0MsZ0NBQVM7SUFJekMsc0JBQXNCLElBQVksRUFBRSxJQUEwQjtRQUExQixxQkFBQSxFQUFBLHlCQUEwQjtRQUE5RCxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQVE7O0lBRWxDLENBQUM7SUFFTSw4QkFBTyxHQUFkLGNBQW1CLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUUzQixvQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXZELG9DQUFhLEdBQXBCLGNBQXlCLE1BQU0sQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFbEQsNkJBQU0sR0FBaEIsY0FBcUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFDLG1CQUFDO0FBQUQsQ0FBQyxBQWZELENBQWtDLGlCQUFTO0FBQ2xCLDBCQUFhLEdBQUcsR0FBRyxDQUFDO0FBQ3BCLHdCQUFXLEdBQUcsR0FBRyxDQUFDO0FBRjlCLG9DQUFZO0FBZXhCLENBQUMifQ==