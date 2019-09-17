"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_array_1 = require("./frame-array");
const frame_atom_1 = require("./frame-atom");
const frame_string_1 = require("./frame-string");
const frame_symbol_1 = require("./frame-symbol");
const meta_frame_1 = require("./meta-frame");
class FrameNote extends frame_atom_1.FrameQuote {
    constructor(data, source, where = frame_1.Frame.nil) {
        super(meta_frame_1.NilContext);
        this.data = data;
        this.where = where;
        this.up = where;
        this.is.note = true;
        this.setLabel(data, source);
        this.id += this.data;
    }
    static test(data, source, sum) {
        const note = new FrameNote(data, source);
        const result = new frame_string_1.FrameString(sum);
        note.set("n", result);
        return note;
    }
    ;
    static key(source, where) { return new FrameNote("!", source, where); }
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
    call(argument, parameter = frame_1.Frame.nil) {
        if (argument !== frame_symbol_1.FrameSymbol.end()) {
            const result = this.addExtra(argument, parameter);
            return result;
        }
        const output = this.get(frame_1.Frame.kOUT);
        output.call(this);
        output.call(frame_symbol_1.FrameSymbol.end());
        return this.up;
    }
    string_prefix() { return FrameNote.NOTE_BEGIN; }
    ;
    string_suffix() { return FrameNote.NOTE_END; }
    ;
    toString() { return this.string_prefix() + this.data + this.meta_string(); }
    setLabel(data, source) {
        const label = FrameNote.LABELS.en[data];
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
    addExtra(argument, parameter) {
        let extras = this.get(FrameNote.NOTE_EXTRAS);
        if (extras.is.missing) {
            extras = new frame_array_1.FrameArray([]);
            this.set(FrameNote.NOTE_EXTRAS, extras);
        }
        extras.apply(argument, parameter);
        return this;
    }
}
exports.FrameNote = FrameNote;
FrameNote.NOTE_BEGIN = "$";
FrameNote.NOTE_END = ";";
FrameNote.NOTE_EXTRAS = "++";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQywrQ0FBMkM7QUFDM0MsNkNBQTBDO0FBQzFDLGlEQUE2QztBQUM3QyxpREFBNkM7QUFDN0MsNkNBQTBDO0FBSzFDLE1BQWEsU0FBVSxTQUFRLHVCQUFVO0lBNEJ2QyxZQUFzQixJQUFZLEVBQUUsTUFBYyxFQUFTLFFBQVEsYUFBSyxDQUFDLEdBQUc7UUFDMUUsS0FBSyxDQUFDLHVCQUFVLENBQUMsQ0FBQztRQURFLFNBQUksR0FBSixJQUFJLENBQVE7UUFBeUIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUUxRSxJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUNoQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUM7SUFuQk0sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFZLEVBQUUsTUFBYyxFQUFFLEdBQVc7UUFDekQsTUFBTSxJQUFJLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLElBQUksMEJBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN0QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFBQSxDQUFDO0lBRUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFjLEVBQUUsS0FBWSxJQUFJLE9BQU8sSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLENB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