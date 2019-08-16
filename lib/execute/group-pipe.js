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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JvdXAtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2dyb3VwLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBOEM7QUFDOUMsNkNBQXlDO0FBR3pDLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBQ3RDLFlBQVksR0FBVTtRQUNwQixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFVLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBTEQsOEJBS0MifQ==