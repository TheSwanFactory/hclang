"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_atom_1 = require("./frame-atom");
const frame_string_1 = require("./frame-string");
const meta_frame_1 = require("./meta-frame");
class FrameNote extends frame_atom_1.FrameQuote {
    constructor(data, source, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = data;
        const label = FrameNote.LABELS.en[this.data];
        if (label) {
            const value = new frame_string_1.FrameString(source);
            this.set(label, value);
        }
        else {
            const value = new frame_string_1.FrameString(data);
            this.set("!", value);
        }
    }
    static key(source) { return new FrameNote("!", source); }
    ;
    static type(source) { return new FrameNote("<>", source); }
    ;
    static index(source) { return new FrameNote(">", source); }
    ;
    static pass(source) { return new FrameNote("+", source); }
    ;
    static fail(source) { return new FrameNote("-", source); }
    ;
    in(contexts = [frame_1.Frame.nil]) {
        return this;
    }
    string_prefix() { return FrameNote.NOTE_BEGIN; }
    ;
    string_suffix() { return FrameNote.NOTE_END; }
    ;
    toString() { return this.string_prefix() + this.data + this.meta_string(); }
    isNote() {
        return true;
    }
}
exports.FrameNote = FrameNote;
FrameNote.NOTE_BEGIN = "$";
FrameNote.NOTE_END = ";";
FrameNote.LABELS = {
    en: {
        "!": "name-missing",
        "+": "test-pass",
        "-": "test-fail",
        "<>": "type-mismatch",
        ">": "bounds-exceeded",
    },
};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBMEM7QUFDMUMsaURBQTZDO0FBQzdDLDZDQUE4RDtBQUs5RCxNQUFhLFNBQVUsU0FBUSx1QkFBVTtJQW9CdkMsWUFBc0IsSUFBWSxFQUFFLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDbkUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRFEsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUVoQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxLQUFLLEVBQUU7WUFDVCxNQUFNLEtBQUssR0FBRyxJQUFJLDBCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDeEI7YUFBTTtZQUNMLE1BQU0sS0FBSyxHQUFHLElBQUksMEJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0QjtJQUNILENBQUM7SUFoQk0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFjLElBQUksT0FBTyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUNsRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQWMsSUFBSSxPQUFPLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ3BFLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBYyxJQUFJLE9BQU8sSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDcEUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFjLElBQUksT0FBTyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUNuRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQWMsSUFBSSxPQUFPLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBY25FLEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLGFBQWEsS0FBSyxPQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVqRCxhQUFhLEtBQUssT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFL0MsUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU1RSxNQUFNO1FBQ1gsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDOztBQTVDSCw4QkE4Q0M7QUE3Q3dCLG9CQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLGtCQUFRLEdBQUcsR0FBRyxDQUFDO0FBRWYsZ0JBQU0sR0FBb0I7SUFDL0MsRUFBRSxFQUFFO1FBQ0YsR0FBRyxFQUFFLGNBQWM7UUFDbkIsR0FBRyxFQUFFLFdBQVc7UUFDaEIsR0FBRyxFQUFFLFdBQVc7UUFDaEIsSUFBSSxFQUFFLGVBQWU7UUFDckIsR0FBRyxFQUFFLGlCQUFpQjtLQUN2QjtDQUNGLENBQUM7QUFrQ0gsQ0FBQyJ9