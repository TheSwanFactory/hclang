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
exports.FrameDoc = FrameDoc;
FrameDoc.DOC_BEGIN = "`";
FrameDoc.DOC_END = "`";
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZG9jLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1kb2MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxpREFBNkM7QUFFN0MsNkNBQW1EO0FBRW5ELE1BQWEsUUFBUyxTQUFRLDBCQUFXO0lBSXZDLFlBQVksSUFBWSxFQUFFLE9BQWdCLHVCQUFVO1FBQ2xELEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUVNLGFBQWEsS0FBSyxPQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUUvQyxhQUFhLEtBQUssT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7O0FBVnRELDRCQVdDO0FBVndCLGtCQUFTLEdBQUcsR0FBRyxDQUFDO0FBQ2hCLGdCQUFPLEdBQUcsR0FBRyxDQUFDO0FBU3RDLENBQUMifQ==