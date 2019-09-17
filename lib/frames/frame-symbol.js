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
            const value = context.get(this.data);
            if (!value.is.missing) {
                value.up = context;
                if (value.is.immediate === true) {
                    return value.call(context);
                }
                return value;
            }
        }
        return frame_note_1.FrameNote.key(first.id + "." + this.data, first);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBZ0M7QUFDaEMsNkNBQXlDO0FBQ3pDLDZDQUF5QztBQUN6Qyw2Q0FBbUQ7QUFFbkQsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFheEMsWUFBc0IsSUFBWSxFQUFFLElBQUksR0FBRyx1QkFBVTtRQUNuRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFRO0lBRWxDLENBQUM7SUFYTSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQWM7UUFDOUIsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQyxPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRU0sTUFBTSxDQUFDLEdBQUcsS0FBSyxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFRckQsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1lBQzlCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtnQkFDckIsS0FBSyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUM7Z0JBQ25CLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUFFO29CQUMvQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQzVCO2dCQUNELE9BQU8sS0FBSyxDQUFDO2FBQ2Q7U0FDRjtRQUNELE9BQU8sc0JBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQWUsRUFBRSxVQUFpQjtRQUM3QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDN0IsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sTUFBTSxDQUFDLEdBQVU7UUFDdEIsTUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRTtZQUNoQixJQUFJLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUN4QjtRQUNELE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVNLFNBQVMsQ0FBQyxPQUFjO1FBQzdCLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVNLFlBQVk7UUFDakIsT0FBTyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdDLENBQUM7SUFBQSxDQUFDO0lBRUssVUFBVSxDQUFDLElBQVk7UUFDNUIsT0FBTyxXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsTUFBTSxLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBM0QxQyxrQ0E0REM7QUEzRHdCLHdCQUFZLEdBQUcsV0FBVyxDQUFDO0FBQzNCLHVCQUFXLEdBQUcsT0FBTyxDQUFDO0FBUzVCLG1CQUFPLEdBQW9DLEVBQUUsQ0FBQztBQWlEaEUsQ0FBQyJ9