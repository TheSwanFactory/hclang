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
        return FrameSymbol.SYMBOL_CHAR.toString();
    }
    ;
    canInclude(char) {
        return FrameSymbol.SYMBOL_CHAR.test(char);
    }
    toData() { return this.data; }
}
FrameSymbol.SYMBOL_CHAR = /[-\w]/;
FrameSymbol.symbols = {};
exports.FrameSymbol = FrameSymbol;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBZ0M7QUFDaEMsNkNBQXlDO0FBQ3pDLDZDQUF5QztBQUN6Qyw2Q0FBbUQ7QUFFbkQsaUJBQXlCLFNBQVEsc0JBQVM7SUFZeEMsWUFBc0IsSUFBWSxFQUFFLElBQUksR0FBRyx1QkFBVTtRQUNuRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFRO0lBRWxDLENBQUM7SUFYTSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQWM7UUFDOUIsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFTSxNQUFNLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBUXJELEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLEdBQUcsQ0FBQyxDQUFDLE1BQU0sT0FBTyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDL0IsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckMsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLGFBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixLQUFLLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQztnQkFDbkIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNmLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUNELE1BQU0sQ0FBQyxzQkFBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsU0FBZ0I7UUFFNUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sTUFBTSxDQUFDLEdBQVU7UUFDdEIsTUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUN6QixDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxTQUFTLENBQUMsT0FBYztRQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVNLFlBQVk7UUFFakIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDNUMsQ0FBQztJQUFBLENBQUM7SUFFSyxVQUFVLENBQUMsSUFBWTtRQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVTLE1BQU0sS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBM0RqQix1QkFBVyxHQUFHLE9BQU8sQ0FBQztBQVM1QixtQkFBTyxHQUFvQyxFQUFFLENBQUM7QUFWakUsa0NBNkRDO0FBQUEsQ0FBQyJ9