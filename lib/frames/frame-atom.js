"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const meta_frame_1 = require("./meta-frame");
class FrameAtom extends frame_1.Frame {
    constructor(meta = meta_frame_1.NilContext) {
        super(meta);
    }
    string_prefix() { return ""; }
    ;
    string_suffix() { return ""; }
    ;
    string_start() { return this.string_prefix(); }
    ;
    toStringData() {
        return this.string_prefix() + this.toData().toString() + this.string_suffix();
    }
    toString() {
        const dataString = this.toStringData();
        const n = this.meta_length();
        if ((n === 0) || (n == 1 && this.meta[frame_1.Frame.kOUT])) {
            return dataString;
        }
        return this.string_open() + [dataString, this.meta_string()].join(", ") + this.string_close();
    }
    canInclude(char) {
        return char !== this.string_suffix();
    }
    toData() { return null; }
}
exports.FrameAtom = FrameAtom;
class FrameQuote extends FrameAtom {
}
exports.FrameQuote = FrameQuote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFpQztBQUNqQyw2Q0FBbUQ7QUFNbkQsTUFBYSxTQUFVLFNBQVEsYUFBSztJQUNsQyxZQUFZLElBQUksR0FBRyx1QkFBVTtRQUMzQixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDZCxDQUFDO0lBRU0sYUFBYSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDL0IsYUFBYSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDL0IsWUFBWSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFaEQsWUFBWTtRQUNqQixPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ2hGLENBQUM7SUFFTSxRQUFRO1FBQ2IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2xELE9BQU8sVUFBVSxDQUFDO1NBQ25CO1FBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNoRyxDQUFDO0lBRU0sVUFBVSxDQUFDLElBQVk7UUFDNUIsT0FBTyxJQUFJLEtBQUssSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFUyxNQUFNLEtBQVUsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0NBQ3pDO0FBM0JELDhCQTJCQztBQUVELE1BQWEsVUFBVyxTQUFRLFNBQVM7Q0FDeEM7QUFERCxnQ0FDQyJ9