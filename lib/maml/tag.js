"use strict";
var frames_1 = require("../frames");
var wrapArg = function (prefix, suffix) {
    return new frames_1.FrameExpr([
        new frames_1.FrameString(prefix),
        frames_1.FrameArg.here(),
        new frames_1.FrameString(suffix),
    ]);
};
exports.tag = new frames_1.FrameExpr([
    new frames_1.FrameLazy([]),
    new frames_1.FrameArray([
        wrapArg("<", ">"),
        frames_1.FrameArg.level(2),
        wrapArg("</", ">"),
    ]),
]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hbWwvdGFnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxvQ0FBb0Y7QUFFcEYsSUFBTSxPQUFPLEdBQUcsVUFBQyxNQUFjLEVBQUUsTUFBYztJQUM3QyxNQUFNLENBQUMsSUFBSSxrQkFBUyxDQUFDO1FBQ25CLElBQUksb0JBQVcsQ0FBQyxNQUFNLENBQUM7UUFDdkIsaUJBQVEsQ0FBQyxJQUFJLEVBQUU7UUFDZixJQUFJLG9CQUFXLENBQUMsTUFBTSxDQUFDO0tBQ3hCLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUVXLFFBQUEsR0FBRyxHQUFHLElBQUksa0JBQVMsQ0FBQztJQUMvQixJQUFJLGtCQUFTLENBQUMsRUFBRSxDQUFDO0lBQ2pCLElBQUksbUJBQVUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO1FBQ2pCLGlCQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNqQixPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztLQUNuQixDQUFDO0NBQ0gsQ0FBQyxDQUFDIn0=