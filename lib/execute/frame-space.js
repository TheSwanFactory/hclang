"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame = require("../frames");
class FrameSpace extends frame.FrameAtom {
    constructor(meta = frame.NilContext) {
        super(meta);
        this.is.void = true;
    }
    string_start() {
        return FrameSpace.SPACE_CHAR;
    }
    ;
    canInclude(char) {
        return char === FrameSpace.SPACE_CHAR;
    }
}
exports.FrameSpace = FrameSpace;
FrameSpace.SPACE_CHAR = ' ';
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3BhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9mcmFtZS1zcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFrQztBQUVsQyxNQUFhLFVBQVcsU0FBUSxLQUFLLENBQUMsU0FBUztJQUc3QyxZQUFhLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVTtRQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDWCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7SUFDckIsQ0FBQztJQUVNLFlBQVk7UUFDakIsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFBO0lBQzlCLENBQUM7SUFBQSxDQUFDO0lBRUssVUFBVSxDQUFFLElBQVk7UUFDN0IsT0FBTyxJQUFJLEtBQUssVUFBVSxDQUFDLFVBQVUsQ0FBQTtJQUN2QyxDQUFDOztBQWRILGdDQWVDO0FBZHdCLHFCQUFVLEdBQUcsR0FBRyxDQUFDO0FBY3pDLENBQUMifQ==