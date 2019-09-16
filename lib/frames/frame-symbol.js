"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_atom_1 = require("./frame-atom");
const frame_note_1 = require("./frame-note");
const meta_frame_1 = require("./meta-frame");
class FrameSymbol extends frame_atom_1.FrameAtom {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = data;
    }
    static for(symbol) {
        const exists = FrameSymbol.symbols[symbol];
        return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
    }
    static end() { return FrameSymbol.for(frame_1.Frame.kEND); }
    ;
    in(contexts = [frame_1.Frame.nil]) {
        const first = contexts[0];
        for (const context of contexts) {
            let value = context.get(this.data);
            if (value.is.missing) {
                value = frame_note_1.FrameNote.key(this.data, first);
            }
            else {
                value.up = context;
                if (value.is.immediate === true) {
                    return value.call(context);
                }
                return value;
            }
        }
        return frame_note_1.FrameNote.key(first.id + "." + this.data, this);
    }
    apply(argument, _parameter) {
        const out = this.get(frame_1.Frame.kOUT);
        out.set(this.data, argument);
        return this;
    }
    setter(out) {
        const meta = {};
        if (!out.is.void) {
            meta[frame_1.Frame.kOUT] = out;
        }
        const setter = new FrameSymbol(this.data, meta);
        return setter;
    }
    called_by(context) {
        return this.in([context]);
    }
    string_start() {
        return FrameSymbol.SYMBOL_BEGIN.toString();
    }
    ;
    canInclude(char) {
        return FrameSymbol.SYMBOL_CHAR.test(char);
    }
    toData() { return this.data; }
}
exports.FrameSymbol = FrameSymbol;
FrameSymbol.SYMBOL_BEGIN = /[-a-zA-Z]/;
FrameSymbol.SYMBOL_CHAR = /[-\w]/;
FrameSymbol.symbols = {};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBZ0M7QUFDaEMsNkNBQXlDO0FBQ3pDLDZDQUF5QztBQUN6Qyw2Q0FBbUQ7QUFFbkQsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFheEMsWUFBc0IsSUFBWSxFQUFFLElBQUksR0FBRyx1QkFBVTtRQUNuRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFRO0lBRWxDLENBQUM7SUFYTSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQWM7UUFDOUIsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQyxPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRU0sTUFBTSxDQUFDLEdBQUcsS0FBSyxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFRckQsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1lBQzlCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7Z0JBQ3BCLEtBQUssR0FBRyxzQkFBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ3pDO2lCQUFNO2dCQUNMLEtBQUssQ0FBQyxFQUFFLEdBQUcsT0FBTyxDQUFDO2dCQUNuQixJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtvQkFDL0IsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUM1QjtnQkFDRCxPQUFPLEtBQUssQ0FBQzthQUNkO1NBQ0Y7UUFDRCxPQUFPLHNCQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsVUFBaUI7UUFDN0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLE1BQU0sQ0FBQyxHQUFVO1FBQ3RCLE1BQU0sSUFBSSxHQUFZLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7WUFDaEIsSUFBSSxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDeEI7UUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxTQUFTLENBQUMsT0FBYztRQUM3QixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFTSxZQUFZO1FBQ2pCLE9BQU8sV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QyxDQUFDO0lBQUEsQ0FBQztJQUVLLFVBQVUsQ0FBQyxJQUFZO1FBQzVCLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVTLE1BQU0sS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQTdEMUMsa0NBOERDO0FBN0R3Qix3QkFBWSxHQUFHLFdBQVcsQ0FBQztBQUMzQix1QkFBVyxHQUFHLE9BQU8sQ0FBQztBQVM1QixtQkFBTyxHQUFvQyxFQUFFLENBQUM7QUFtRGhFLENBQUMifQ==