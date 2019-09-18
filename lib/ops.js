"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLHFEQUFvRDtBQUNwRCwrQ0FBMkM7QUFDM0MsK0NBQWlGO0FBRXBFLFFBQUEsR0FBRyxHQUFHLElBQUksb0JBQVEsQ0FBQztJQUM5QixHQUFHLEVBQUcseUJBQWE7SUFDbkIsSUFBSSxFQUFFLHlCQUFhO0lBQ25CLEdBQUcsRUFBRSxxQkFBTTtJQUNYLEdBQUcsRUFBRSxxQkFBTTtJQUNYLEdBQUcsRUFBRyw0QkFBZ0I7Q0FDdkIsQ0FBQyxDQUFDIn0=