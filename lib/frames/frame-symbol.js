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
    static end() {
        return FrameSymbol.for(frame_1.Frame.kEND);
    }
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
        return frame_note_1.FrameNote.key(first.id + '.' + this.data, first);
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
    toData() {
        return this.data;
    }
}
exports.FrameSymbol = FrameSymbol;
FrameSymbol.SYMBOL_BEGIN = /[a-zA-Z]/;
FrameSymbol.SYMBOL_CHAR = /[-\w]/;
FrameSymbol.symbols = {};
;
class FrameOperator extends FrameSymbol {
    string_start() {
        return FrameOperator.OPERATOR_BEGIN.toString();
    }
    ;
    canInclude(char) {
        return FrameOperator.OPERATOR_CHAR.test(char);
    }
}
exports.FrameOperator = FrameOperator;
FrameOperator.OPERATOR_BEGIN = /[&|?:+\-*=<>!]/;
FrameOperator.OPERATOR_CHAR = /[&|?:+\-*=<>!]/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBK0I7QUFDL0IsNkNBQXdDO0FBQ3hDLDZDQUF3QztBQUN4Qyw2Q0FBa0Q7QUFFbEQsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFleEMsWUFBdUIsSUFBWSxFQUFFLElBQUksR0FBRyx1QkFBVTtRQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFEVSxTQUFJLEdBQUosSUFBSSxDQUFRO0lBRW5DLENBQUM7SUFiTSxNQUFNLENBQUMsR0FBRyxDQUFFLE1BQWM7UUFDL0IsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMxQyxPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtJQUMxRSxDQUFDO0lBRU0sTUFBTSxDQUFDLEdBQUc7UUFDZixPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFBQSxDQUFDO0lBUUssRUFBRSxDQUFFLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDL0IsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3pCLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1lBQzlCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3BDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtnQkFDckIsS0FBSyxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUE7Z0JBQ2xCLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUFFO29CQUMvQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7aUJBQzNCO2dCQUNELE9BQU8sS0FBSyxDQUFBO2FBQ2I7U0FDRjtRQUNELE9BQU8sc0JBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0lBRU0sS0FBSyxDQUFFLFFBQWUsRUFBRSxVQUFpQjtRQUM5QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDNUIsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRU0sTUFBTSxDQUFFLEdBQVU7UUFDdkIsTUFBTSxJQUFJLEdBQVksRUFBRSxDQUFBO1FBQ3hCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRTtZQUNoQixJQUFJLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQTtTQUN2QjtRQUNELE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDL0MsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRU0sU0FBUyxDQUFFLE9BQWM7UUFDOUIsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtJQUMzQixDQUFDO0lBRU0sWUFBWTtRQUNqQixPQUFPLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDNUMsQ0FBQztJQUFBLENBQUM7SUFFSyxVQUFVLENBQUUsSUFBWTtRQUM3QixPQUFPLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFUyxNQUFNO1FBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQ2xCLENBQUM7O0FBL0RILGtDQWdFQztBQS9Ed0Isd0JBQVksR0FBRyxVQUFVLENBQUM7QUFDMUIsdUJBQVcsR0FBRyxPQUFPLENBQUM7QUFXNUIsbUJBQU8sR0FBb0MsRUFBRSxDQUFDO0FBbURoRSxDQUFDO0FBRUYsTUFBYSxhQUFjLFNBQVEsV0FBVztJQUlyQyxZQUFZO1FBQ2pCLE9BQU8sYUFBYSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUNoRCxDQUFDO0lBQUEsQ0FBQztJQUVLLFVBQVUsQ0FBRSxJQUFZO1FBQzdCLE9BQU8sYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDL0MsQ0FBQzs7QUFWSCxzQ0FXQztBQVZ3Qiw0QkFBYyxHQUFHLGdCQUFnQixDQUFDO0FBQ2xDLDJCQUFhLEdBQUcsZ0JBQWdCLENBQUMifQ==