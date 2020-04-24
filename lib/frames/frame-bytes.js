"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_atom_1 = require("./frame-atom");
const meta_frame_1 = require("./meta-frame");
class FrameBytes extends frame_atom_1.FrameQuote {
    constructor(values, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = new Uint8Array(values);
        this.length = values.length;
    }
    string_prefix() {
        return FrameBytes.BYTES_BEGIN;
    }
    ;
    string_suffix() {
        return FrameBytes.BYTES_END;
    }
    ;
    toStringData() {
        return this.string_prefix() + this.length + this.string_suffix() + this.toData();
    }
    toData() {
        let s = '';
        this.data.forEach((value) => {
            s = s + String.fromCharCode(value);
        });
        return s;
    }
}
exports.FrameBytes = FrameBytes;
FrameBytes.BYTES_BEGIN = '\\';
FrameBytes.BYTES_END = '\\';
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYnl0ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWJ5dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsNkNBQXlDO0FBQ3pDLDZDQUFrRDtBQUVsRCxNQUFhLFVBQVcsU0FBUSx1QkFBVTtJQU94QyxZQUFhLE1BQWdCLEVBQUUsT0FBZ0IsdUJBQVU7UUFDdkQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUE7SUFDN0IsQ0FBQztJQUVNLGFBQWE7UUFDbEIsT0FBTyxVQUFVLENBQUMsV0FBVyxDQUFBO0lBQy9CLENBQUM7SUFBQSxDQUFDO0lBRUssYUFBYTtRQUNsQixPQUFPLFVBQVUsQ0FBQyxTQUFTLENBQUE7SUFDN0IsQ0FBQztJQUFBLENBQUM7SUFFSyxZQUFZO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUNsRixDQUFDO0lBRVMsTUFBTTtRQUNkLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDMUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3BDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxDQUFDLENBQUE7SUFDVixDQUFDOztBQS9CSCxnQ0FnQ0M7QUEvQndCLHNCQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ25CLG9CQUFTLEdBQUcsSUFBSSxDQUFDO0FBOEJ6QyxDQUFDIn0=