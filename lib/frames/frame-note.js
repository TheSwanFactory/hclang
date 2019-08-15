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
}
FrameNote.NOTE_BEGIN = "$";
FrameNote.NOTE_END = ";";
FrameNote.LABELS = {
    en: {
        "!": "name-missing",
        "<>": "type-mismatch",
        ">": "bounds-exceeded",
    },
};
exports.FrameNote = FrameNote;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBMEM7QUFDMUMsaURBQTZDO0FBQzdDLDZDQUE4RDtBQUs5RCxlQUF1QixTQUFRLHVCQUFVO0lBZ0J2QyxZQUFzQixJQUFZLEVBQUUsTUFBYyxFQUFFLElBQUksR0FBRyx1QkFBVTtRQUNuRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFRO1FBRWhDLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1YsTUFBTSxLQUFLLEdBQUcsSUFBSSwwQkFBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sS0FBSyxHQUFHLElBQUksMEJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2QixDQUFDO0lBQ0gsQ0FBQztJQWRNLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBYyxJQUFJLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUNsRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQWMsSUFBSSxNQUFNLENBQUMsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDcEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFjLElBQUksTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBY3BFLEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sYUFBYSxLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFakQsYUFBYSxLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFL0MsUUFBUSxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQW5DNUQsb0JBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIsa0JBQVEsR0FBRyxHQUFHLENBQUM7QUFFZixnQkFBTSxHQUFvQjtJQUMvQyxFQUFFLEVBQUU7UUFDRixHQUFHLEVBQUUsY0FBYztRQUNuQixJQUFJLEVBQUUsZUFBZTtRQUNyQixHQUFHLEVBQUUsaUJBQWlCO0tBQ3ZCO0NBQ0YsQ0FBQztBQVZKLDhCQXNDQztBQUFBLENBQUMifQ==