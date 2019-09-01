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
        if (this.meta_length() === 0) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFpQztBQUNqQyw2Q0FBbUQ7QUFNbkQsTUFBYSxTQUFVLFNBQVEsYUFBSztJQUNsQyxZQUFZLElBQUksR0FBRyx1QkFBVTtRQUMzQixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDZCxDQUFDO0lBRU0sYUFBYSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDL0IsYUFBYSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDL0IsWUFBWSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFaEQsWUFBWTtRQUNqQixPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ2hGLENBQUM7SUFFTSxRQUFRO1FBQ2IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3ZDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsRUFBRTtZQUM1QixPQUFPLFVBQVUsQ0FBQztTQUNuQjtRQUNELE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDaEcsQ0FBQztJQUVNLFVBQVUsQ0FBQyxJQUFZO1FBQzVCLE9BQU8sSUFBSSxLQUFLLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRVMsTUFBTSxLQUFVLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztDQUN6QztBQTFCRCw4QkEwQkM7QUFFRCxNQUFhLFVBQVcsU0FBUSxTQUFTO0NBQ3hDO0FBREQsZ0NBQ0MifQ==