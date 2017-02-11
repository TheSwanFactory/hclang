"use strict";
var frames_1 = require("../frames");
exports.MetaMap = function (source, block) {
    var array = source.meta_pairs().map(function (_a) {
        var key = _a[0], value = _a[1];
        var fkey = new frames_1.FrameString(key);
        return block.call(value, fkey);
    });
    return new frames_1.FrameArray(array);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmF0b3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wcy9pdGVyYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9DQUEyRDtBQUU5QyxRQUFBLE9BQU8sR0FBRyxVQUFDLE1BQWEsRUFBRSxLQUFZO0lBQ2pELElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUUsVUFBQyxFQUFZO1lBQVgsV0FBRyxFQUFFLGFBQUs7UUFDakQsSUFBTSxJQUFJLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxJQUFJLG1CQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDIn0=