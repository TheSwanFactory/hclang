"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const parse_pipe_1 = require("./parse-pipe");
class GroupPipe extends parse_pipe_1.ParsePipe {
    constructor(out) {
        super(out);
        this.factory = frames_1.FrameGroup;
    }
}
exports.GroupPipe = GroupPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JvdXAtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2dyb3VwLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBOEM7QUFDOUMsNkNBQXlDO0FBR3pDLGVBQXVCLFNBQVEsc0JBQVM7SUFDdEMsWUFBWSxHQUFVO1FBQ3BCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQVUsQ0FBQztJQUM1QixDQUFDO0NBQ0Y7QUFMRCw4QkFLQyJ9