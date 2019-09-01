"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const parse_pipe_1 = require("./parse-pipe");
class GroupPipe extends parse_pipe_1.ParsePipe {
    constructor(out, factory) {
        super(out, factory);
    }
    call(argument, parameter = frames_1.Frame.nil) {
        if (argument === frames_1.FrameSymbol.end()) {
            return this.finish(argument);
        }
        return super.call(argument, parameter);
    }
    ;
}
exports.GroupPipe = GroupPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JvdXAtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2dyb3VwLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMkQ7QUFDM0QsNkNBQXlDO0FBRXpDLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBQ3RDLFlBQVksR0FBVSxFQUFFLE9BQVk7UUFDbEMsS0FBSyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRU0sSUFBSSxDQUFDLFFBQWUsRUFBRSxTQUFTLEdBQUcsY0FBSyxDQUFDLEdBQUc7UUFDaEQsSUFBSSxRQUFRLEtBQUssb0JBQVcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNsQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDOUI7UUFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFBQSxDQUFDO0NBRUg7QUFaRCw4QkFZQyJ9