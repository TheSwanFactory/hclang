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
        note.set('n', result);
        return note;
    }
    ;
    static key(source, where) {
        return new FrameNote('!', source, where);
    }
    ;
    static type(source) {
        return new FrameNote('<>', source);
    }
    ;
    static index(source) {
        return new FrameNote('>', source);
    }
    ;
    static pass(source, sum) {
        return FrameNote.test('+', source, sum);
    }
    ;
    static fail(source, sum) {
        return FrameNote.test('-', source, sum);
    }
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
    string_prefix() {
        return FrameNote.NOTE_BEGIN;
    }
    ;
    string_suffix() {
        return FrameNote.NOTE_END;
    }
    ;
    toString() {
        return this.string_prefix() + this.data + this.meta_string();
    }
    setLabel(data, source) {
        const label = FrameNote.LABELS.en[data];
        let value = new frame_string_1.FrameString(data);
        let key = '!';
        if (label) {
            key = label;
            value = new frame_string_1.FrameString(source);
        }
        if (key === '!') {
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
FrameNote.NOTE_BEGIN = '$';
FrameNote.NOTE_END = ';';
FrameNote.NOTE_EXTRAS = '++';
FrameNote.LABELS = {
    en: {
        '!': 'name-missing',
        '+': 'test-pass',
        '-': 'test-fail',
        '<>': 'type-mismatch',
        '>': 'bounds-exceeded'
    }
};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUErQjtBQUMvQiwrQ0FBMEM7QUFDMUMsNkNBQXlDO0FBQ3pDLGlEQUE0QztBQUM1QyxpREFBNEM7QUFDNUMsNkNBQXlDO0FBS3pDLE1BQWEsU0FBVSxTQUFRLHVCQUFVO0lBMEN2QyxZQUF1QixJQUFZLEVBQUUsTUFBYyxFQUFTLFFBQVEsYUFBSyxDQUFDLEdBQUc7UUFDM0UsS0FBSyxDQUFDLHVCQUFVLENBQUMsQ0FBQTtRQURJLFNBQUksR0FBSixJQUFJLENBQVE7UUFBeUIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUUzRSxJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQTtRQUNmLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNuQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUMzQixJQUFJLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDdEIsQ0FBQztJQWpDTSxNQUFNLENBQUMsSUFBSSxDQUFFLElBQVksRUFBRSxNQUFjLEVBQUUsR0FBVztRQUMzRCxNQUFNLElBQUksR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDeEMsTUFBTSxNQUFNLEdBQUcsSUFBSSwwQkFBVyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3JCLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUFBLENBQUM7SUFFSyxNQUFNLENBQUMsR0FBRyxDQUFFLE1BQWMsRUFBRSxLQUFZO1FBQzdDLE9BQU8sSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLENB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