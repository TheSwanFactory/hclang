"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_atom_1 = require("./frame-atom");
const frame_note_1 = require("./frame-note");
const frame_symbol_1 = require("./frame-symbol");
const meta_frame_1 = require("./meta-frame");
class FrameAlias extends frame_atom_1.FrameAtom {
    constructor(source, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = frame_symbol_1.FrameSymbol.for(source);
    }
    in(contexts = [frame_1.Frame.nil]) {
        const key = this.data.toString();
        for (const context of contexts) {
            const out = this.find(context, key);
            if (out !== frame_1.Frame.nil) {
                const setter = this.data.setter(out);
                return setter;
            }
        }
        return frame_note_1.FrameNote.key(key, this);
    }
    string_prefix() { return FrameAlias.ALIAS_BEGIN; }
    ;
    canInclude(char) {
        return frame_symbol_1.FrameSymbol.SYMBOL_CHAR.test(char);
    }
    toData() { return this.data; }
    find(context, key) {
        while (context !== frame_1.Frame.missing) {
            const here = context.get_here(key);
            if (!here.is.missing) {
                return context;
            }
            context = context.up;
        }
        return frame_1.Frame.nil;
    }
}
exports.FrameAlias = FrameAlias;
FrameAlias.ALIAS_BEGIN = "@";
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYWxpYXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFsaWFzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWdDO0FBQ2hDLDZDQUF5QztBQUN6Qyw2Q0FBeUM7QUFDekMsaURBQTZDO0FBQzdDLDZDQUEwQztBQUUxQyxNQUFhLFVBQVcsU0FBUSxzQkFBUztJQUt2QyxZQUFZLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDM0MsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRywwQkFBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtZQUM5QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwQyxJQUFJLEdBQUcsS0FBSyxhQUFLLENBQUMsR0FBRyxFQUFFO2dCQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckMsT0FBTyxNQUFNLENBQUM7YUFDZjtTQUNGO1FBQ0QsT0FBTyxzQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLGFBQWEsS0FBSyxPQUFPLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVuRCxVQUFVLENBQUMsSUFBWTtRQUM1QixPQUFPLDBCQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsTUFBTSxLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFOUIsSUFBSSxDQUFDLE9BQWMsRUFBRSxHQUFXO1FBQ3hDLE9BQU8sT0FBTyxLQUFLLGFBQUssQ0FBQyxPQUFPLEVBQUU7WUFDaEMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7Z0JBQ3BCLE9BQU8sT0FBTyxDQUFDO2FBQ2hCO1lBQ0QsT0FBTyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUM7U0FDdEI7UUFDRCxPQUFPLGFBQUssQ0FBQyxHQUFHLENBQUM7SUFDbkIsQ0FBQzs7QUF2Q0gsZ0NBd0NDO0FBdkN3QixzQkFBVyxHQUFHLEdBQUcsQ0FBQztBQXVDMUMsQ0FBQyJ9