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
var frame_atom_1 = require("./frame-atom");
var meta_frame_1 = require("./meta-frame");
var FrameComment = (function (_super) {
    __extends(FrameComment, _super);
    function FrameComment(data, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        return _this;
    }
    FrameComment.prototype.isVoid = function () { return true; };
    ;
    FrameComment.prototype.string_prefix = function () { return FrameComment.COMMENT_BEGIN; };
    ;
    FrameComment.prototype.string_suffix = function () { return FrameComment.COMMENT_END; };
    ;
    FrameComment.prototype.canInclude = function (char) {
        switch (char) {
            case FrameComment.COMMENT_END: {
                return false;
            }
            case FrameComment.COMMENT_EOL: {
                return false;
            }
        }
        return true;
    };
    FrameComment.prototype.toData = function () { return this.data; };
    return FrameComment;
}(frame_atom_1.FrameQuote));
FrameComment.COMMENT_BEGIN = "#";
FrameComment.COMMENT_END = "#";
FrameComment.COMMENT_EOL = "\n";
exports.FrameComment = FrameComment;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBMEM7QUFDMUMsMkNBQW1EO0FBRW5EO0lBQWtDLGdDQUFVO0lBSzFDLHNCQUFzQixJQUFZLEVBQUUsSUFBMEI7UUFBMUIscUJBQUEsRUFBQSw4QkFBMEI7UUFBOUQsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FDWjtRQUZxQixVQUFJLEdBQUosSUFBSSxDQUFROztJQUVsQyxDQUFDO0lBRU0sNkJBQU0sR0FBYixjQUFrQixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFMUIsb0NBQWEsR0FBcEIsY0FBeUIsTUFBTSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUV2RCxvQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXJELGlDQUFVLEdBQWpCLFVBQWtCLElBQVk7UUFDNUIsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNiLEtBQUssWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM5QixNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2YsQ0FBQztZQUNELEtBQUssWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM5QixNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2YsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVTLDZCQUFNLEdBQWhCLGNBQXFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQyxtQkFBQztBQUFELENBQUMsQUE1QkQsQ0FBa0MsdUJBQVU7QUFDbkIsMEJBQWEsR0FBRyxHQUFHLENBQUM7QUFDcEIsd0JBQVcsR0FBRyxHQUFHLENBQUM7QUFDbEIsd0JBQVcsR0FBRyxJQUFJLENBQUM7QUFIL0Isb0NBQVk7QUE0QnhCLENBQUMifQ==