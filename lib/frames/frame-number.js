"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1udW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMENBQTJCO0FBQzNCLDZDQUF3QztBQUN4Qyw2Q0FBa0Q7QUFFbEQsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFZeEMsWUFBYSxNQUFjLEVBQUUsT0FBZ0IsdUJBQVU7UUFDckQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ2hDLENBQUM7SUFYTSxNQUFNLENBQUMsR0FBRyxDQUFFLE1BQWM7UUFDL0IsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMxQyxPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtJQUMxRSxDQUFDO0lBVU0sWUFBWTtRQUNqQixPQUFPLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDNUMsQ0FBQztJQUFBLENBQUM7SUFFSyxVQUFVLENBQUUsSUFBWTtRQUM3QixPQUFPLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFUyxNQUFNO1FBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQ2xCLENBQUM7O0FBM0JILGtDQTRCQztBQTNCd0Isd0JBQVksR0FBRyxPQUFPLENBQUM7QUFDdkIsdUJBQVcsR0FBRyxJQUFJLENBQUM7QUFPekIsbUJBQU8sR0FBb0MsRUFBRSxDQUFDO0FBbUJoRSxDQUFDIn0=