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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFNbkMsb0JBQTRCLFNBQVEsS0FBSyxDQUFDLEtBQUs7Q0FFOUM7QUFGRCx3Q0FFQztBQUVELG9CQUE0QixTQUFRLEtBQUssQ0FBQyxTQUFTO0lBQ2pELFlBQVksSUFBNEIsRUFBRSxPQUFzQixLQUFLLENBQUMsVUFBVTtRQUM5RSxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkIsQ0FBQztDQUNGO0FBTEQsd0NBS0M7QUFBQSxDQUFDO0FBRVcsUUFBQSxPQUFPLEdBQWM7SUFDaEMsSUFBSSxFQUFFLEVBQUU7SUFDUixHQUFHLEVBQUUsRUFBRTtJQUNQLEdBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxjQUFjLEVBQUM7Q0FDNUIsQ0FBQztBQUVGLGtCQUFrQixPQUFnQztJQUNoRCxNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2pELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNsQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDcEMsZUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQyxDQUFDO0lBQ2hDLGVBQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQsUUFBUSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyJ9