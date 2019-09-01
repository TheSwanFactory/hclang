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
        return FrameNumber.NUMBER_CHAR.toString();
    }
    ;
    canInclude(char) {
        return FrameNumber.NUMBER_CHAR.test(char);
    }
    toData() { return this.data; }
}
exports.FrameNumber = FrameNumber;
FrameNumber.NUMBER_CHAR = /\d/;
FrameNumber.numbers = {};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1udW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBNEI7QUFDNUIsNkNBQXlDO0FBQ3pDLDZDQUFtRDtBQUVuRCxNQUFhLFdBQVksU0FBUSxzQkFBUztJQVd4QyxZQUFZLE1BQWMsRUFBRSxPQUFnQix1QkFBVTtRQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQVhNLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBYztRQUM5QixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLE9BQU8sTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFVTSxZQUFZO1FBQ2pCLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBQUEsQ0FBQztJQUVLLFVBQVUsQ0FBQyxJQUFZO1FBQzVCLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVTLE1BQU0sS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQXhCMUMsa0NBeUJDO0FBeEJ3Qix1QkFBVyxHQUFHLElBQUksQ0FBQztBQU96QixtQkFBTyxHQUFvQyxFQUFFLENBQUM7QUFpQmhFLENBQUMifQ==