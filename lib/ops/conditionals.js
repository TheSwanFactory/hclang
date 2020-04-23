"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
exports.IfThen = (source, block) => {
    if (source !== frames_1.Frame.nil) {
        return block.call(frames_1.Frame.nil);
    }
    return frames_1.Frame.nil;
};
exports.IfElse = (source, block) => {
    if (source === frames_1.Frame.nil) {
        return block.call(frames_1.Frame.nil);
    }
    return frames_1.Frame.nil;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZGl0aW9uYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wcy9jb25kaXRpb25hbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBaUM7QUFFcEIsUUFBQSxNQUFNLEdBQUcsQ0FBQyxNQUFhLEVBQUUsS0FBWSxFQUFFLEVBQUU7SUFDcEQsSUFBSSxNQUFNLEtBQUssY0FBSyxDQUFDLEdBQUcsRUFBRTtRQUN4QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQzdCO0lBQ0QsT0FBTyxjQUFLLENBQUMsR0FBRyxDQUFBO0FBQ2xCLENBQUMsQ0FBQTtBQUVZLFFBQUEsTUFBTSxHQUFHLENBQUMsTUFBYSxFQUFFLEtBQVksRUFBRSxFQUFFO0lBQ3BELElBQUksTUFBTSxLQUFLLGNBQUssQ0FBQyxHQUFHLEVBQUU7UUFDeEIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUM3QjtJQUNELE9BQU8sY0FBSyxDQUFDLEdBQUcsQ0FBQTtBQUNsQixDQUFDLENBQUEifQ==