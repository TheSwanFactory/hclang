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
    static test(data, source, sum) {
        const note = new FrameNote(data, source);
        const result = new frame_string_1.FrameString(sum);
        note.set("n", result);
        return note;
    }
    ;
    static key(source) { return new FrameNote("!", source); }
    ;
    static type(source) { return new FrameNote("<>", source); }
    ;
    static index(source) { return new FrameNote(">", source); }
    ;
    static pass(source, sum) { return FrameNote.test("+", source, sum); }
    ;
    static fail(source, sum) { return FrameNote.test("-", source, sum); }
    ;
    in(_contexts = [frame_1.Frame.nil]) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBMEM7QUFDMUMsaURBQTZDO0FBQzdDLDZDQUEwQztBQUsxQyxNQUFhLFNBQVUsU0FBUSx1QkFBVTtJQTJCdkMsWUFBc0IsSUFBWSxFQUFFLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDbkUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRFEsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUVoQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxLQUFLLEdBQUcsSUFBSSwwQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNkLElBQUksS0FBSyxFQUFFO1lBQ1QsR0FBRyxHQUFHLEtBQUssQ0FBQztZQUNaLEtBQUssR0FBRyxJQUFJLDBCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDakM7UUFDRCxJQUFJLEdBQUcsS0FBSyxHQUFHLEVBQUU7WUFDZixJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDeEI7UUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBMUJNLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBWSxFQUFFLE1BQWMsRUFBRSxHQUFXO1FBQ3pELE1BQU0sSUFBSSxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLE1BQU0sR0FBRyxJQUFJLDBCQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdEIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQUEsQ0FBQztJQUVJLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBYyxJQUFJLE9BQU8sSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFjLElBQUksT0FBTyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUNwRSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQWMsSUFBSSxPQUFPLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ3BFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBYyxFQUFFLEdBQVcsSUFBSSxPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ3RGLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBYyxFQUFFLEdBQVcsSUFBSSxPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBaUJ0RixFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUMvQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxhQUFhLEtBQUssT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFakQsYUFBYSxLQUFLLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRS9DLFFBQVEsS0FBSyxPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFNUUsTUFBTTtRQUNYLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQzs7QUF0REgsOEJBd0RDO0FBdkR3QixvQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixrQkFBUSxHQUFHLEdBQUcsQ0FBQztBQUVmLGdCQUFNLEdBQW9CO0lBQy9DLEVBQUUsRUFBRTtRQUNGLEdBQUcsRUFBRSxjQUFjO1FBQ25CLEdBQUcsRUFBRSxXQUFXO1FBQ2hCLEdBQUcsRUFBRSxXQUFXO1FBQ2hCLElBQUksRUFBRSxlQUFlO1FBQ3JCLEdBQUcsRUFBRSxpQkFBaUI7S0FDdkI7Q0FDRixDQUFDO0FBNENILENBQUMifQ==