"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame = require("../frames");
class FrameSpace extends frame.FrameAtom {
    string_start() { return FrameSpace.SPACE_CHAR; }
    ;
    canInclude(char) {
        return char === FrameSpace.SPACE_CHAR;
    }
    isVoid() {
        return true;
    }
}
FrameSpace.SPACE_CHAR = " ";
exports.FrameSpace = FrameSpace;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3BhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9mcmFtZS1zcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFtQztBQUVuQyxnQkFBd0IsU0FBUSxLQUFLLENBQUMsU0FBUztJQUd0QyxZQUFZLEtBQUssTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVqRCxVQUFVLENBQUMsSUFBWTtRQUM1QixNQUFNLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxVQUFVLENBQUM7SUFDeEMsQ0FBQztJQUVNLE1BQU07UUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQzs7QUFWc0IscUJBQVUsR0FBRyxHQUFHLENBQUM7QUFEMUMsZ0NBWUM7QUFBQSxDQUFDIn0=