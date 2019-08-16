"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame = require("../frames");
class FrameStatement extends frame.Frame {
}
exports.FrameStatement = FrameStatement;
class FrameLazyGroup extends frame.FrameLazy {
    constructor(data, meta = frame.NilContext) {
        const group = new frame.FrameGroup(data);
        super([group], meta);
    }
}
exports.FrameLazyGroup = FrameLazyGroup;
;
exports.actions = {
    "\n": {},
    ",": {},
    ";": { wrap: FrameStatement },
};
function addGroup(grouper) {
    const sample = new grouper([], frame.NilContext);
    const open = sample.string_open();
    const close = sample.string_close();
    exports.actions[open] = { push: grouper };
    exports.actions[close] = { pop: grouper };
}
addGroup(frame.FrameGroup);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFNbkMsTUFBYSxjQUFlLFNBQVEsS0FBSyxDQUFDLEtBQUs7Q0FFOUM7QUFGRCx3Q0FFQztBQUVELE1BQWEsY0FBZSxTQUFRLEtBQUssQ0FBQyxTQUFTO0lBQ2pELFlBQVksSUFBNEIsRUFBRSxPQUFzQixLQUFLLENBQUMsVUFBVTtRQUM5RSxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkIsQ0FBQztDQUNGO0FBTEQsd0NBS0M7QUFBQSxDQUFDO0FBRVcsUUFBQSxPQUFPLEdBQWM7SUFDaEMsSUFBSSxFQUFFLEVBQUU7SUFDUixHQUFHLEVBQUUsRUFBRTtJQUNQLEdBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxjQUFjLEVBQUM7Q0FDNUIsQ0FBQztBQUVGLFNBQVMsUUFBUSxDQUFDLE9BQWdDO0lBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDakQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2xDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNwQyxlQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLENBQUM7SUFDaEMsZUFBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFFLE9BQU8sRUFBQyxDQUFDO0FBQ2xDLENBQUM7QUFFRCxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDIn0=