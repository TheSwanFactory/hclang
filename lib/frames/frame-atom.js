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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXRvbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFpQztBQUVqQyw2Q0FBbUQ7QUFNbkQsZUFBdUIsU0FBUSxhQUFLO0lBQ2xDLFlBQVksSUFBSSxHQUFHLHVCQUFVO1FBQzNCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFTSxhQUFhLEtBQUssTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQy9CLGFBQWEsS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDL0IsWUFBWSxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVoRCxZQUFZO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUNoRixDQUFDO0lBRU0sUUFBUTtRQUNiLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3BCLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDaEcsQ0FBQztJQUVNLFVBQVUsQ0FBQyxJQUFZO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFUyxNQUFNLEtBQVUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDekM7QUExQkQsOEJBMEJDO0FBRUQsZ0JBQXdCLFNBQVEsU0FBUztDQUN4QztBQURELGdDQUNDIn0=