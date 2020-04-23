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
    string_prefix() {
        return FrameAlias.ALIAS_BEGIN;
    }
    ;
    canInclude(char) {
        return frame_symbol_1.FrameSymbol.SYMBOL_CHAR.test(char);
    }
    toData() {
        return this.data;
    }
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
FrameAlias.ALIAS_BEGIN = '@';
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYWxpYXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFsaWFzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQStCO0FBQy9CLDZDQUF3QztBQUN4Qyw2Q0FBd0M7QUFDeEMsaURBQTRDO0FBQzVDLDZDQUF5QztBQUV6QyxNQUFhLFVBQVcsU0FBUSxzQkFBUztJQUt2QyxZQUFhLE1BQWMsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDNUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLElBQUksR0FBRywwQkFBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNyQyxDQUFDO0lBRU0sRUFBRSxDQUFFLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDL0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUNoQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtZQUM5QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUNuQyxJQUFJLEdBQUcsS0FBSyxhQUFLLENBQUMsR0FBRyxFQUFFO2dCQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDcEMsT0FBTyxNQUFNLENBQUE7YUFDZDtTQUNGO1FBQ0QsT0FBTyxzQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDakMsQ0FBQztJQUVNLGFBQWE7UUFDbEIsT0FBTyxVQUFVLENBQUMsV0FBVyxDQUFBO0lBQy9CLENBQUM7SUFBQSxDQUFDO0lBRUssVUFBVSxDQUFFLElBQVk7UUFDN0IsT0FBTywwQkFBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVTLE1BQU07UUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQztJQUVTLElBQUksQ0FBRSxPQUFjLEVBQUUsR0FBVztRQUN6QyxPQUFPLE9BQU8sS0FBSyxhQUFLLENBQUMsT0FBTyxFQUFFO1lBQ2hDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO2dCQUNwQixPQUFPLE9BQU8sQ0FBQTthQUNmO1lBQ0QsT0FBTyxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUE7U0FDckI7UUFDRCxPQUFPLGFBQUssQ0FBQyxHQUFHLENBQUE7SUFDbEIsQ0FBQzs7QUEzQ0gsZ0NBNENDO0FBM0N3QixzQkFBVyxHQUFHLEdBQUcsQ0FBQztBQTJDMUMsQ0FBQyJ9