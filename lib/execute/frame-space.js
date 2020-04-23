"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const frame = __importStar(require("../frames"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3BhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9mcmFtZS1zcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxpREFBa0M7QUFFbEMsTUFBYSxVQUFXLFNBQVEsS0FBSyxDQUFDLFNBQVM7SUFHN0MsWUFBYSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVU7UUFDbEMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0lBQ3JCLENBQUM7SUFFTSxZQUFZO1FBQ2pCLE9BQU8sVUFBVSxDQUFDLFVBQVUsQ0FBQTtJQUM5QixDQUFDO0lBQUEsQ0FBQztJQUVLLFVBQVUsQ0FBRSxJQUFZO1FBQzdCLE9BQU8sSUFBSSxLQUFLLFVBQVUsQ0FBQyxVQUFVLENBQUE7SUFDdkMsQ0FBQzs7QUFkSCxnQ0FlQztBQWR3QixxQkFBVSxHQUFHLEdBQUcsQ0FBQztBQWN6QyxDQUFDIn0=