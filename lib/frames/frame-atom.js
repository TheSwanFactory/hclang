"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const meta_frame_1 = require("./meta-frame");
class FrameAtom extends frame_1.Frame {
    constructor(meta = meta_frame_1.NilContext) {
        super(meta);
    }
    string_prefix() {
        return '';
    }
    ;
    string_suffix() {
        return '';
    }
    ;
    string_start() {
        return this.string_prefix();
    }
    ;
    toStringData() {
        return this.string_prefix() + this.toData().toString() + this.string_suffix();
    }
    toString() {
        const dataString = this.toStringData();
        const n = this.meta_length();
        if ((n === 0) || (n === 1 && this.meta[frame_1.Frame.kOUT])) {
            return dataString;
        }
        return this.string_open() + [dataString, this.meta_string()].join(', ') + this.string_close();
    }
    canInclude(char) {
        return char !== this.string_suffix();
    }
    toData() {
        return null;
    }
}
exports.FrameAtom = FrameAtom;
class FrameQuote extends FrameAtom {
}
exports.FrameQuote = FrameQuote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUErQjtBQUMvQiw2Q0FBa0Q7QUFNbEQsTUFBYSxTQUFVLFNBQVEsYUFBSztJQUNsQyxZQUFhLElBQUksR0FBRyx1QkFBVTtRQUM1QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDYixDQUFDO0lBRU0sYUFBYTtRQUNsQixPQUFPLEVBQUUsQ0FBQTtJQUNYLENBQUM7SUFBQSxDQUFDO0lBRUssYUFBYTtRQUNsQixPQUFPLEVBQUUsQ0FBQTtJQUNYLENBQUM7SUFBQSxDQUFDO0lBRUssWUFBWTtRQUNqQixPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtJQUM3QixDQUFDO0lBQUEsQ0FBQztJQUVLLFlBQVk7UUFDakIsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtJQUMvRSxDQUFDO0lBRU0sUUFBUTtRQUNiLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtRQUN0QyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDNUIsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNuRCxPQUFPLFVBQVUsQ0FBQTtTQUNsQjtRQUNELE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7SUFDL0YsQ0FBQztJQUVNLFVBQVUsQ0FBRSxJQUFZO1FBQzdCLE9BQU8sSUFBSSxLQUFLLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtJQUN0QyxDQUFDO0lBRVMsTUFBTTtRQUNkLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztDQUNGO0FBckNELDhCQXFDQztBQUVELE1BQWEsVUFBVyxTQUFRLFNBQVM7Q0FDeEM7QUFERCxnQ0FDQyJ9