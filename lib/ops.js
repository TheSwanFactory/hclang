"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frame_curry_1 = require("./ops/frame-curry");
exports.FrameCurry = frame_curry_1.FrameCurry;
const conditionals_1 = require("./ops/conditionals");
const frame_ops_1 = require("./ops/frame-ops");
const iterators_1 = require("./ops/iterators");
exports.Ops = new frame_ops_1.FrameOps({
    "&": iterators_1.MapEnumerable,
    "&&": iterators_1.MapProperties,
    ":": conditionals_1.IfElse,
    "?": conditionals_1.IfThen,
    "|": iterators_1.ReduceEnumerable,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUErRDtBQUF0RCxtQ0FBQSxVQUFVLENBQUE7QUFFbkIscURBQW9EO0FBQ3BELCtDQUEyQztBQUMzQywrQ0FBaUY7QUFFcEUsUUFBQSxHQUFHLEdBQUcsSUFBSSxvQkFBUSxDQUFDO0lBQzlCLEdBQUcsRUFBRyx5QkFBYTtJQUNuQixJQUFJLEVBQUUseUJBQWE7SUFDbkIsR0FBRyxFQUFFLHFCQUFNO0lBQ1gsR0FBRyxFQUFFLHFCQUFNO0lBQ1gsR0FBRyxFQUFHLDRCQUFnQjtDQUN2QixDQUFDLENBQUMifQ==