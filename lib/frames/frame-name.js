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
    string_prefix() {
        return FrameName.NAME_BEGIN;
    }
    ;
    canInclude(char) {
        return frame_symbol_1.FrameSymbol.SYMBOL_CHAR.test(char) ||
            frame_symbol_1.FrameOperator.OPERATOR_CHAR.test(char);
    }
    toData() {
        return this.data;
    }
}
exports.FrameName = FrameName;
FrameName.NAME_BEGIN = '.';
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUErQjtBQUMvQiw2Q0FBd0M7QUFDeEMsaURBQTJEO0FBQzNELDZDQUF5QztBQUV6QyxNQUFhLFNBQVUsU0FBUSxzQkFBUztJQUt0QyxZQUFhLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDNUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLElBQUksR0FBRywwQkFBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNyQyxDQUFDO0lBRU0sRUFBRSxDQUFFLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDL0IsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3ZCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ3BDLE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVNLGFBQWE7UUFDbEIsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFBO0lBQzdCLENBQUM7SUFBQSxDQUFDO0lBRUssVUFBVSxDQUFFLElBQVk7UUFDN0IsT0FBTywwQkFBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ2xDLDRCQUFhLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUMvQyxDQUFDO0lBRVMsTUFBTTtRQUNkLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQTtJQUNsQixDQUFDOztBQTNCSCw4QkE0QkM7QUEzQndCLG9CQUFVLEdBQUcsR0FBRyxDQUFDO0FBMkJ6QyxDQUFDIn0=