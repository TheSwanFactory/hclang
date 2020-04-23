"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_string_1 = require("./frame-string");
const meta_frame_1 = require("./meta-frame");
class FrameDoc extends frame_string_1.FrameString {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    string_prefix() {
        return FrameDoc.DOC_BEGIN;
    }
    ;
    string_suffix() {
        return FrameDoc.DOC_END;
    }
    ;
}
exports.FrameDoc = FrameDoc;
FrameDoc.DOC_BEGIN = '`';
FrameDoc.DOC_END = '`';
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZG9jLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1kb2MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxpREFBNEM7QUFFNUMsNkNBQWtEO0FBRWxELE1BQWEsUUFBUyxTQUFRLDBCQUFXO0lBSXZDLFlBQWEsSUFBWSxFQUFFLE9BQWdCLHVCQUFVO1FBQ25ELEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDbkIsQ0FBQztJQUVNLGFBQWE7UUFDbEIsT0FBTyxRQUFRLENBQUMsU0FBUyxDQUFBO0lBQzNCLENBQUM7SUFBQSxDQUFDO0lBRUssYUFBYTtRQUNsQixPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUE7SUFDekIsQ0FBQztJQUFBLENBQUM7O0FBZEosNEJBZUM7QUFkd0Isa0JBQVMsR0FBRyxHQUFHLENBQUM7QUFDaEIsZ0JBQU8sR0FBRyxHQUFHLENBQUM7QUFhdEMsQ0FBQyJ9