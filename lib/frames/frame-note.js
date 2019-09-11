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
        let value = new frame_string_1.FrameString(data);
        let key = "!";
        if (label) {
            key = label;
            value = new frame_string_1.FrameString(source);
        }
        if (key === "!") {
            this.is.missing = true;
        }
        this.set(key, value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBMEM7QUFDMUMsaURBQTZDO0FBQzdDLDZDQUE4RDtBQUs5RCxNQUFhLFNBQVUsU0FBUSx1QkFBVTtJQW9CdkMsWUFBc0IsSUFBWSxFQUFFLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDbkUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRFEsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUVoQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxLQUFLLEdBQUcsSUFBSSwwQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNkLElBQUksS0FBSyxFQUFFO1lBQ1QsR0FBRyxHQUFHLEtBQUssQ0FBQztZQUNaLEtBQUssR0FBRyxJQUFJLDBCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDakM7UUFDRCxJQUFJLEdBQUcsS0FBSyxHQUFHLEVBQUU7WUFDZixJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDeEI7UUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBbkJNLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBYyxJQUFJLE9BQU8sSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFjLElBQUksT0FBTyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUNwRSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQWMsSUFBSSxPQUFPLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ3BFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBYyxJQUFJLE9BQU8sSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDbkUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFjLElBQUksT0FBTyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQWlCbkUsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sYUFBYSxLQUFLLE9BQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRWpELGFBQWEsS0FBSyxPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUUvQyxRQUFRLEtBQUssT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTVFLE1BQU07UUFDWCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7O0FBL0NILDhCQWlEQztBQWhEd0Isb0JBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIsa0JBQVEsR0FBRyxHQUFHLENBQUM7QUFFZixnQkFBTSxHQUFvQjtJQUMvQyxFQUFFLEVBQUU7UUFDRixHQUFHLEVBQUUsY0FBYztRQUNuQixHQUFHLEVBQUUsV0FBVztRQUNoQixHQUFHLEVBQUUsV0FBVztRQUNoQixJQUFJLEVBQUUsZUFBZTtRQUNyQixHQUFHLEVBQUUsaUJBQWlCO0tBQ3ZCO0NBQ0YsQ0FBQztBQXFDSCxDQUFDIn0=