"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_atom_1 = require("./frame-atom");
const frame_symbol_1 = require("./frame-symbol");
const meta_frame_1 = require("./meta-frame");
class FrameName extends frame_atom_1.FrameAtom {
    constructor(source, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = frame_symbol_1.FrameSymbol.for(source);
    }
    in(contexts = [frame_1.Frame.nil]) {
        const out = contexts[0];
        const setter = this.data.setter(out);
        return setter;
    }
    string_prefix() { return FrameName.NAME_BEGIN; }
    ;
    canInclude(char) {
        return frame_symbol_1.FrameSymbol.SYMBOL_CHAR.test(char);
    }
    toData() { return this.data; }
}
FrameName.NAME_BEGIN = ".";
exports.FrameName = FrameName;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBeUM7QUFDekMsaURBQTZDO0FBQzdDLDZDQUFtRDtBQUVuRCxNQUFhLFNBQVUsU0FBUSxzQkFBUztJQUt0QyxZQUFZLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDM0MsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRywwQkFBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxhQUFhLEtBQUssT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFakQsVUFBVSxDQUFDLElBQVk7UUFDNUIsT0FBTywwQkFBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVTLE1BQU0sS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQXJCakIsb0JBQVUsR0FBRyxHQUFHLENBQUM7QUFEMUMsOEJBdUJDO0FBQUEsQ0FBQyJ9