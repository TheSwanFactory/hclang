"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const wrapArg = (prefix, suffix) => {
    return new frames_1.FrameExpr([
        new frames_1.FrameString(prefix),
        frames_1.FrameArg.here(),
        new frames_1.FrameString(suffix)
    ]);
};
exports.tag = new frames_1.FrameExpr([
    new frames_1.FrameLazy([]),
    new frames_1.FrameArray([
        wrapArg('<', '>'),
        frames_1.FrameArg.level(2),
        wrapArg('</', '>')
    ])
]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hbWwvdGFnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQW1GO0FBRW5GLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBYyxFQUFFLE1BQWMsRUFBRSxFQUFFO0lBQ2pELE9BQU8sSUFBSSxrQkFBUyxDQUFDO1FBQ25CLElBQUksb0JBQVcsQ0FBQyxNQUFNLENBQUM7UUFDdkIsaUJBQVEsQ0FBQyxJQUFJLEVBQUU7UUFDZixJQUFJLG9CQUFXLENBQUMsTUFBTSxDQUFDO0tBQ3hCLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQUVZLFFBQUEsR0FBRyxHQUFHLElBQUksa0JBQVMsQ0FBQztJQUMvQixJQUFJLGtCQUFTLENBQUMsRUFBRSxDQUFDO0lBQ2pCLElBQUksbUJBQVUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO1FBQ2pCLGlCQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNqQixPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztLQUNuQixDQUFDO0NBQ0gsQ0FBQyxDQUFBIn0=