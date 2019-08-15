"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_string_1 = require("./frame-string");
const meta_frame_1 = require("./meta-frame");
class FrameDoc extends frame_string_1.FrameString {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    string_prefix() { return FrameDoc.DOC_BEGIN; }
    ;
    string_suffix() { return FrameDoc.DOC_END; }
    ;
}
FrameDoc.DOC_BEGIN = "`";
FrameDoc.DOC_END = "`";
exports.FrameDoc = FrameDoc;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZG9jLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1kb2MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxpREFBNkM7QUFFN0MsNkNBQW1EO0FBRW5ELGNBQXNCLFNBQVEsMEJBQVc7SUFJdkMsWUFBWSxJQUFZLEVBQUUsT0FBZ0IsdUJBQVU7UUFDbEQsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBRU0sYUFBYSxLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFL0MsYUFBYSxLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7O0FBVDdCLGtCQUFTLEdBQUcsR0FBRyxDQUFDO0FBQ2hCLGdCQUFPLEdBQUcsR0FBRyxDQUFDO0FBRnZDLDRCQVdDO0FBQUEsQ0FBQyJ9