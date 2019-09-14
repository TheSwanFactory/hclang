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
        return frame_note_1.FrameNote.key(key);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYWxpYXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFsaWFzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWdDO0FBQ2hDLDZDQUF5QztBQUN6Qyw2Q0FBeUM7QUFDekMsaURBQTZDO0FBQzdDLDZDQUEwQztBQUUxQyxNQUFhLFVBQVcsU0FBUSxzQkFBUztJQUt2QyxZQUFZLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDM0MsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRywwQkFBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtZQUM5QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwQyxJQUFJLEdBQUcsS0FBSyxhQUFLLENBQUMsR0FBRyxFQUFFO2dCQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckMsT0FBTyxNQUFNLENBQUM7YUFDZjtTQUNGO1FBQ0QsT0FBTyxzQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRU0sYUFBYSxLQUFLLE9BQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRW5ELFVBQVUsQ0FBQyxJQUFZO1FBQzVCLE9BQU8sMEJBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFUyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUU5QixJQUFJLENBQUMsT0FBYyxFQUFFLEdBQVc7UUFDeEMsT0FBTyxPQUFPLEtBQUssYUFBSyxDQUFDLE9BQU8sRUFBRTtZQUNoQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtnQkFDcEIsT0FBTyxPQUFPLENBQUM7YUFDaEI7WUFDRCxPQUFPLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQztTQUN0QjtRQUNELE9BQU8sYUFBSyxDQUFDLEdBQUcsQ0FBQztJQUNuQixDQUFDOztBQXZDSCxnQ0F3Q0M7QUF2Q3dCLHNCQUFXLEdBQUcsR0FBRyxDQUFDO0FBdUMxQyxDQUFDIn0=