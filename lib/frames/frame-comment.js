"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_atom_1 = require("./frame-atom");
const meta_frame_1 = require("./meta-frame");
class FrameComment extends frame_atom_1.FrameQuote {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = data;
    }
    isVoid() { return true; }
    ;
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
FrameComment.COMMENT_BEGIN = "#";
FrameComment.COMMENT_END = "#";
FrameComment.COMMENT_EOL = "\n";
exports.FrameComment = FrameComment;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZDQUEwQztBQUMxQyw2Q0FBbUQ7QUFFbkQsa0JBQTBCLFNBQVEsdUJBQVU7SUFLMUMsWUFBc0IsSUFBWSxFQUFFLE9BQWdCLHVCQUFVO1FBQzVELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURRLFNBQUksR0FBSixJQUFJLENBQVE7SUFFbEMsQ0FBQztJQUVNLE1BQU0sS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFMUIsYUFBYSxLQUFLLE1BQU0sQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFdkQsYUFBYSxLQUFLLE1BQU0sQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFckQsVUFBVSxDQUFDLElBQVk7UUFDNUIsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNiLEtBQUssWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM5QixNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2YsQ0FBQztZQUNELEtBQUssWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM5QixNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2YsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVTLE1BQU0sS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBMUJqQiwwQkFBYSxHQUFHLEdBQUcsQ0FBQztBQUNwQix3QkFBVyxHQUFHLEdBQUcsQ0FBQztBQUNsQix3QkFBVyxHQUFHLElBQUksQ0FBQztBQUg1QyxvQ0E0QkM7QUFBQSxDQUFDIn0=