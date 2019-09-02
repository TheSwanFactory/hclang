"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame = require("../frames");
class FrameSpace extends frame.FrameAtom {
    constructor(meta = frame.NilContext) {
        super(meta);
        this.is.void = true;
    }
    string_start() { return FrameSpace.SPACE_CHAR; }
    ;
    canInclude(char) {
        return char === FrameSpace.SPACE_CHAR;
    }
}
exports.FrameSpace = FrameSpace;
FrameSpace.SPACE_CHAR = " ";
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3BhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9mcmFtZS1zcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFtQztBQUVuQyxNQUFhLFVBQVcsU0FBUSxLQUFLLENBQUMsU0FBUztJQUc3QyxZQUFZLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVTtRQUNqQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDdEIsQ0FBQztJQUVNLFlBQVksS0FBSyxPQUFPLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVqRCxVQUFVLENBQUMsSUFBWTtRQUM1QixPQUFPLElBQUksS0FBSyxVQUFVLENBQUMsVUFBVSxDQUFDO0lBQ3hDLENBQUM7O0FBWkgsZ0NBYUM7QUFad0IscUJBQVUsR0FBRyxHQUFHLENBQUM7QUFZekMsQ0FBQyJ9