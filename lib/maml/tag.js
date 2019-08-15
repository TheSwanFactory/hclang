"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const wrapArg = (prefix, suffix) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hbWwvdGFnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQW9GO0FBRXBGLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBYyxFQUFFLE1BQWMsRUFBRSxFQUFFO0lBQ2pELE1BQU0sQ0FBQyxJQUFJLGtCQUFTLENBQUM7UUFDbkIsSUFBSSxvQkFBVyxDQUFDLE1BQU0sQ0FBQztRQUN2QixpQkFBUSxDQUFDLElBQUksRUFBRTtRQUNmLElBQUksb0JBQVcsQ0FBQyxNQUFNLENBQUM7S0FDeEIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBRVcsUUFBQSxHQUFHLEdBQUcsSUFBSSxrQkFBUyxDQUFDO0lBQy9CLElBQUksa0JBQVMsQ0FBQyxFQUFFLENBQUM7SUFDakIsSUFBSSxtQkFBVSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7UUFDakIsaUJBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDO0tBQ25CLENBQUM7Q0FDSCxDQUFDLENBQUMifQ==