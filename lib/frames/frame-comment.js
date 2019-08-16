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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZDQUEwQztBQUMxQyw2Q0FBbUQ7QUFFbkQsTUFBYSxZQUFhLFNBQVEsdUJBQVU7SUFLMUMsWUFBc0IsSUFBWSxFQUFFLE9BQWdCLHVCQUFVO1FBQzVELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURRLFNBQUksR0FBSixJQUFJLENBQVE7SUFFbEMsQ0FBQztJQUVNLE1BQU0sS0FBSyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRTFCLGFBQWEsS0FBSyxPQUFPLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUV2RCxhQUFhLEtBQUssT0FBTyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFckQsVUFBVSxDQUFDLElBQVk7UUFDNUIsUUFBUSxJQUFJLEVBQUU7WUFDWixLQUFLLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDN0IsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUNELEtBQUssWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUM3QixPQUFPLEtBQUssQ0FBQzthQUNkO1NBQ0Y7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFUyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUExQmpCLDBCQUFhLEdBQUcsR0FBRyxDQUFDO0FBQ3BCLHdCQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLHdCQUFXLEdBQUcsSUFBSSxDQUFDO0FBSDVDLG9DQTRCQztBQUFBLENBQUMifQ==