"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frames_1 = require("../frames");
exports.MetaMap = function (source, block) {
    var array = source.meta_pairs().map(function (_a) {
        var key = _a[0], value = _a[1];
        var fkey = new frames_1.FrameString(key);
        return block.call(value, fkey);
    });
    return new frames_1.FrameArray(array);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmF0b3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wcy9pdGVyYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvQ0FBMkQ7QUFFOUMsUUFBQSxPQUFPLEdBQUcsVUFBQyxNQUFhLEVBQUUsS0FBWTtJQUNqRCxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxDQUFFLFVBQUMsRUFBWTtZQUFYLFdBQUcsRUFBRSxhQUFLO1FBQ2pELElBQU0sSUFBSSxHQUFHLElBQUksb0JBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFNLENBQUMsSUFBSSxtQkFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyJ9