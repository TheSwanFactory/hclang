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
    FrameComment.prototype.toData = function () { return this.data; };
    return FrameComment;
}(frame_atom_1.FrameQuote));
FrameComment.COMMENT_BEGIN = "#";
FrameComment.COMMENT_END = "#";
exports.FrameComment = FrameComment;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBMEM7QUFDMUMsMkNBQW1EO0FBRW5EO0lBQWtDLGdDQUFVO0lBSTFDLHNCQUFzQixJQUFZLEVBQUUsSUFBMEI7UUFBMUIscUJBQUEsRUFBQSw4QkFBMEI7UUFBOUQsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FDWjtRQUZxQixVQUFJLEdBQUosSUFBSSxDQUFROztJQUVsQyxDQUFDO0lBRU0sNkJBQU0sR0FBYixjQUFrQixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFMUIsb0NBQWEsR0FBcEIsY0FBeUIsTUFBTSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUV2RCxvQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRWxELDZCQUFNLEdBQWhCLGNBQXFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQyxtQkFBQztBQUFELENBQUMsQUFmRCxDQUFrQyx1QkFBVTtBQUNuQiwwQkFBYSxHQUFHLEdBQUcsQ0FBQztBQUNwQix3QkFBVyxHQUFHLEdBQUcsQ0FBQztBQUY5QixvQ0FBWTtBQWV4QixDQUFDIn0=