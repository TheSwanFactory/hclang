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
        for (const context of contexts) {
            const value = context.get(this.data);
            if (value !== frame_1.Frame.missing) {
                value.up = context;
                if (value.callme === false) {
                    return value;
                }
                else {
                    return value.call(context);
                }
            }
        }
        return frame_note_1.FrameNote.key(this.data);
    }
    apply(argument, parameter) {
        const out = this.get(frame_1.Frame.kOUT);
        out.set(this.data, argument);
        return this;
    }
    setter(out) {
        const meta = {};
        if (!out.isVoid()) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBZ0M7QUFDaEMsNkNBQXlDO0FBQ3pDLDZDQUF5QztBQUN6Qyw2Q0FBbUQ7QUFFbkQsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFheEMsWUFBc0IsSUFBWSxFQUFFLElBQUksR0FBRyx1QkFBVTtRQUNuRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFRO0lBRWxDLENBQUM7SUFYTSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQWM7UUFDOUIsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQyxPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRU0sTUFBTSxDQUFDLEdBQUcsS0FBSyxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFRckQsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7WUFDOUIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckMsSUFBSSxLQUFLLEtBQUssYUFBSyxDQUFDLE9BQU8sRUFBRTtnQkFDM0IsS0FBSyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUM7Z0JBQ25CLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUU7b0JBQzFCLE9BQU8sS0FBSyxDQUFDO2lCQUNkO3FCQUFNO29CQUNMLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDNUI7YUFDRjtTQUNGO1FBQ0QsT0FBTyxzQkFBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsU0FBZ0I7UUFFNUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLE1BQU0sQ0FBQyxHQUFVO1FBQ3RCLE1BQU0sSUFBSSxHQUFZLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1NBQ3hCO1FBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sU0FBUyxDQUFDLE9BQWM7UUFDN0IsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRU0sWUFBWTtRQUNqQixPQUFPLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0MsQ0FBQztJQUFBLENBQUM7SUFFSyxVQUFVLENBQUMsSUFBWTtRQUM1QixPQUFPLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFUyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUE1RDFDLGtDQTZEQztBQTVEd0Isd0JBQVksR0FBRyxXQUFXLENBQUM7QUFDM0IsdUJBQVcsR0FBRyxPQUFPLENBQUM7QUFTNUIsbUJBQU8sR0FBb0MsRUFBRSxDQUFDO0FBa0RoRSxDQUFDIn0=