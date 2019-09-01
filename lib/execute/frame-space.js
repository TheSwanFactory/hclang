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
exports.FrameSpace = FrameSpace;
FrameSpace.SPACE_CHAR = " ";
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3BhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9mcmFtZS1zcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFtQztBQUVuQyxNQUFhLFVBQVcsU0FBUSxLQUFLLENBQUMsU0FBUztJQUd0QyxZQUFZLEtBQUssT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFakQsVUFBVSxDQUFDLElBQVk7UUFDNUIsT0FBTyxJQUFJLEtBQUssVUFBVSxDQUFDLFVBQVUsQ0FBQztJQUN4QyxDQUFDO0lBRU0sTUFBTTtRQUNYLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQzs7QUFYSCxnQ0FZQztBQVh3QixxQkFBVSxHQUFHLEdBQUcsQ0FBQztBQVd6QyxDQUFDIn0=