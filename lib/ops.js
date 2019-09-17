"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_ops_1 = require("./ops/frame-ops");
const iterators_1 = require("./ops/iterators");
exports.Ops = new frame_ops_1.FrameOps({
    "&": iterators_1.MapEnumerable,
    "&&": iterators_1.MapProperties,
    "|": iterators_1.ReduceEnumerable,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLCtDQUEyQztBQUMzQywrQ0FBaUY7QUFFcEUsUUFBQSxHQUFHLEdBQUcsSUFBSSxvQkFBUSxDQUFDO0lBQzlCLEdBQUcsRUFBRyx5QkFBYTtJQUNuQixJQUFJLEVBQUUseUJBQWE7SUFDbkIsR0FBRyxFQUFHLDRCQUFnQjtDQUN2QixDQUFDLENBQUMifQ==