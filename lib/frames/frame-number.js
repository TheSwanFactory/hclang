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
    toData() { return this.data; }
}
FrameNumber.NUMBER_BEGIN = "0-9";
FrameNumber.NUMBER_END = "^0-9";
exports.FrameNumber = FrameNumber;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1udW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBNEI7QUFFNUIsNkNBQXlDO0FBQ3pDLDZDQUFtRDtBQUVuRCxpQkFBeUIsU0FBUSxzQkFBUztJQUt4QyxZQUFZLE1BQWMsRUFBRSxPQUFnQix1QkFBVTtRQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVTLE1BQU0sS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBVGpCLHdCQUFZLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLHNCQUFVLEdBQUcsTUFBTSxDQUFDO0FBRjdDLGtDQVdDO0FBQUEsQ0FBQyJ9