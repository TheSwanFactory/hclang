"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_atom_1 = require("./frame-atom");
const meta_frame_1 = require("./meta-frame");
class FrameComment extends frame_atom_1.FrameQuote {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = data;
        this.is.void = true;
    }
    string_prefix() { return FrameComment.COMMENT_BEGIN; }
    ;
    string_suffix() { return FrameComment.COMMENT_END; }
    ;
    canInclude(char) {
        return !FrameComment.COMMENT_END_REGEX.test(char);
    }
    toData() { return this.data; }
}
exports.FrameComment = FrameComment;
FrameComment.COMMENT_BEGIN = "#";
FrameComment.COMMENT_END = "#";
FrameComment.COMMENT_EOL = "\n";
FrameComment.COMMENT_END_REGEX = /[#\n]/;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZDQUEwQztBQUMxQyw2Q0FBbUQ7QUFFbkQsTUFBYSxZQUFhLFNBQVEsdUJBQVU7SUFNMUMsWUFBc0IsSUFBWSxFQUFFLE9BQWdCLHVCQUFVO1FBQzVELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURRLFNBQUksR0FBSixJQUFJLENBQVE7UUFFaEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ3RCLENBQUM7SUFFTSxhQUFhLEtBQUssT0FBTyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFdkQsYUFBYSxLQUFLLE9BQU8sWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXJELFVBQVUsQ0FBQyxJQUFZO1FBQzVCLE9BQU8sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFUyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFuQjFDLG9DQW9CQztBQW5Cd0IsMEJBQWEsR0FBRyxHQUFHLENBQUM7QUFDcEIsd0JBQVcsR0FBRyxHQUFHLENBQUM7QUFDbEIsd0JBQVcsR0FBRyxJQUFJLENBQUM7QUFDbkIsOEJBQWlCLEdBQUcsT0FBTyxDQUFDO0FBZ0JwRCxDQUFDIn0=