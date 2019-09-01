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
        "<>": "type-mismatch",
        ">": "bounds-exceeded",
    },
};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBMEM7QUFDMUMsaURBQTZDO0FBQzdDLDZDQUE4RDtBQUs5RCxNQUFhLFNBQVUsU0FBUSx1QkFBVTtJQWdCdkMsWUFBc0IsSUFBWSxFQUFFLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDbkUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRFEsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUVoQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxLQUFLLEVBQUU7WUFDVCxNQUFNLEtBQUssR0FBRyxJQUFJLDBCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDeEI7YUFBTTtZQUNMLE1BQU0sS0FBSyxHQUFHLElBQUksMEJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0QjtJQUNILENBQUM7SUFkTSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQWMsSUFBSSxPQUFPLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBYyxJQUFJLE9BQU8sSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDcEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFjLElBQUksT0FBTyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQWNwRSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxhQUFhLEtBQUssT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFakQsYUFBYSxLQUFLLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRS9DLFFBQVEsS0FBSyxPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFNUUsTUFBTTtRQUNYLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQzs7QUF4Q0gsOEJBMENDO0FBekN3QixvQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixrQkFBUSxHQUFHLEdBQUcsQ0FBQztBQUVmLGdCQUFNLEdBQW9CO0lBQy9DLEVBQUUsRUFBRTtRQUNGLEdBQUcsRUFBRSxjQUFjO1FBQ25CLElBQUksRUFBRSxlQUFlO1FBQ3JCLEdBQUcsRUFBRSxpQkFBaUI7S0FDdkI7Q0FDRixDQUFDO0FBZ0NILENBQUMifQ==