"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conditionals_1 = require("./ops/conditionals");
const frame_ops_1 = require("./ops/frame-ops");
const iterators_1 = require("./ops/iterators");
var frame_curry_1 = require("./ops/frame-curry");
exports.FrameCurry = frame_curry_1.FrameCurry;
exports.Ops = new frame_ops_1.FrameOps({
    '&': iterators_1.MapEnumerable,
    '&&': iterators_1.MapProperties,
    ':': conditionals_1.IfElse,
    '?': conditionals_1.IfThen,
    '|': iterators_1.ReduceEnumerable
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFEQUFtRDtBQUNuRCwrQ0FBMEM7QUFDMUMsK0NBQWdGO0FBRWhGLGlEQUE4RDtBQUFyRCxtQ0FBQSxVQUFVLENBQUE7QUFFTixRQUFBLEdBQUcsR0FBRyxJQUFJLG9CQUFRLENBQUM7SUFDOUIsR0FBRyxFQUFFLHlCQUFhO0lBQ2xCLElBQUksRUFBRSx5QkFBYTtJQUNuQixHQUFHLEVBQUUscUJBQU07SUFDWCxHQUFHLEVBQUUscUJBQU07SUFDWCxHQUFHLEVBQUUsNEJBQWdCO0NBQ3RCLENBQUMsQ0FBQSJ9