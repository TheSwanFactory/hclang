"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_atom_1 = require("./frame-atom");
const meta_frame_1 = require("./meta-frame");
class FrameComment extends frame_atom_1.FrameAtom {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = data;
        this.is.void = true;
    }
    string_prefix() {
        return FrameComment.COMMENT_BEGIN;
    }
    ;
    string_suffix() {
        return FrameComment.COMMENT_END;
    }
    ;
    canInclude(char) {
        return !FrameComment.COMMENT_END_REGEX.test(char);
    }
    toData() {
        return this.data;
    }
}
exports.FrameComment = FrameComment;
FrameComment.COMMENT_BEGIN = '#';
FrameComment.COMMENT_END = '#';
FrameComment.COMMENT_EOL = '\n';
FrameComment.COMMENT_END_REGEX = /#/;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZDQUF3QztBQUN4Qyw2Q0FBa0Q7QUFFbEQsTUFBYSxZQUFhLFNBQVEsc0JBQVM7SUFNekMsWUFBdUIsSUFBWSxFQUFFLE9BQWdCLHVCQUFVO1FBQzdELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQURVLFNBQUksR0FBSixJQUFJLENBQVE7UUFFakMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0lBQ3JCLENBQUM7SUFFTSxhQUFhO1FBQ2xCLE9BQU8sWUFBWSxDQUFDLGFBQWEsQ0FBQTtJQUNuQyxDQUFDO0lBQUEsQ0FBQztJQUVLLGFBQWE7UUFDbEIsT0FBTyxZQUFZLENBQUMsV0FBVyxDQUFBO0lBQ2pDLENBQUM7SUFBQSxDQUFDO0lBRUssVUFBVSxDQUFFLElBQVk7UUFDN0IsT0FBTyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDbkQsQ0FBQztJQUVTLE1BQU07UUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQzs7QUF6Qkgsb0NBMEJDO0FBekJ3QiwwQkFBYSxHQUFHLEdBQUcsQ0FBQztBQUNwQix3QkFBVyxHQUFHLEdBQUcsQ0FBQztBQUNsQix3QkFBVyxHQUFHLElBQUksQ0FBQztBQUNuQiw4QkFBaUIsR0FBRyxHQUFHLENBQUM7QUFzQmhELENBQUMifQ==