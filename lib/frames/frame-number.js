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
    string_start() { return FrameNumber.NUMBER_BEGIN; }
    ;
    toData() { return this.data; }
}
FrameNumber.NUMBER_BEGIN = "0-9";
FrameNumber.NUMBER_END = "^0-9";
exports.FrameNumber = FrameNumber;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1udW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBNEI7QUFDNUIsNkNBQXlDO0FBQ3pDLDZDQUFtRDtBQUVuRCxNQUFhLFdBQVksU0FBUSxzQkFBUztJQU94QyxZQUFZLE1BQWMsRUFBRSxPQUFnQix1QkFBVTtRQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUxNLFlBQVksS0FBSyxPQUFPLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQU9qRCxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFYakIsd0JBQVksR0FBRyxLQUFLLENBQUM7QUFDckIsc0JBQVUsR0FBRyxNQUFNLENBQUM7QUFGN0Msa0NBYUM7QUFBQSxDQUFDIn0=