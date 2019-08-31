"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const parse_pipe_1 = require("./parse-pipe");
class GroupPipe extends parse_pipe_1.ParsePipe {
    constructor(out) {
        super(out);
        this.factory = frames_1.FrameGroup;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JvdXAtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2dyb3VwLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBMkQ7QUFDM0QsNkNBQXlDO0FBRXpDLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBQ3RDLFlBQVksR0FBVTtRQUNwQixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFVLENBQUM7SUFDNUIsQ0FBQztJQUVNLElBQUksQ0FBQyxRQUFlLEVBQUUsU0FBUyxHQUFHLGNBQUssQ0FBQyxHQUFHO1FBQ2hELElBQUksUUFBUSxLQUFLLG9CQUFXLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDbEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzlCO1FBQ0QsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBQUEsQ0FBQztDQUVIO0FBYkQsOEJBYUMifQ==