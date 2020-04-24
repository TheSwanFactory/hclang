"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frame_atom_1 = require("./frame-atom");
const meta_frame_1 = require("./meta-frame");
class FrameNumber extends frame_atom_1.FrameAtom {
    constructor(source, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = _.toNumber(source);
    }
    static for(digits) {
        const exists = FrameNumber.numbers[digits];
        return exists || (FrameNumber.numbers[digits] = new FrameNumber(digits));
    }
    string_start() {
        return FrameNumber.NUMBER_BEGIN.toString();
    }
    ;
    canInclude(char) {
        return FrameNumber.NUMBER_CHAR.test(char);
    }
    toData() {
        return this.data;
    }
}
exports.FrameNumber = FrameNumber;
FrameNumber.NUMBER_BEGIN = /[1-9]/;
FrameNumber.NUMBER_CHAR = /\d/;
FrameNumber.numbers = {};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1udW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBMkI7QUFDM0IsNkNBQXdDO0FBQ3hDLDZDQUFrRDtBQUVsRCxNQUFhLFdBQVksU0FBUSxzQkFBUztJQVl4QyxZQUFhLE1BQWMsRUFBRSxPQUFnQix1QkFBVTtRQUNyRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDWCxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDaEMsQ0FBQztJQVhNLE1BQU0sQ0FBQyxHQUFHLENBQUUsTUFBYztRQUMvQixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzFDLE9BQU8sTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO0lBQzFFLENBQUM7SUFVTSxZQUFZO1FBQ2pCLE9BQU8sV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM1QyxDQUFDO0lBQUEsQ0FBQztJQUVLLFVBQVUsQ0FBRSxJQUFZO1FBQzdCLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVTLE1BQU07UUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQzs7QUEzQkgsa0NBNEJDO0FBM0J3Qix3QkFBWSxHQUFHLE9BQU8sQ0FBQztBQUN2Qix1QkFBVyxHQUFHLElBQUksQ0FBQztBQU96QixtQkFBTyxHQUFvQyxFQUFFLENBQUM7QUFtQmhFLENBQUMifQ==