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
        switch (char) {
            case FrameComment.COMMENT_END: {
                return false;
            }
            case FrameComment.COMMENT_EOL: {
                return false;
            }
        }
        return true;
    }
    toData() { return this.data; }
}
exports.FrameComment = FrameComment;
FrameComment.COMMENT_BEGIN = "#";
FrameComment.COMMENT_END = "#";
FrameComment.COMMENT_EOL = "\n";
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZDQUEwQztBQUMxQyw2Q0FBbUQ7QUFFbkQsTUFBYSxZQUFhLFNBQVEsdUJBQVU7SUFLMUMsWUFBc0IsSUFBWSxFQUFFLE9BQWdCLHVCQUFVO1FBQzVELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURRLFNBQUksR0FBSixJQUFJLENBQVE7UUFFaEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ3RCLENBQUM7SUFFTSxhQUFhLEtBQUssT0FBTyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFdkQsYUFBYSxLQUFLLE9BQU8sWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXJELFVBQVUsQ0FBQyxJQUFZO1FBQzVCLFFBQVEsSUFBSSxFQUFFO1lBQ1osS0FBSyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFDRCxLQUFLLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDN0IsT0FBTyxLQUFLLENBQUM7YUFDZDtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRVMsTUFBTSxLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBMUIxQyxvQ0EyQkM7QUExQndCLDBCQUFhLEdBQUcsR0FBRyxDQUFDO0FBQ3BCLHdCQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLHdCQUFXLEdBQUcsSUFBSSxDQUFDO0FBd0IzQyxDQUFDIn0=