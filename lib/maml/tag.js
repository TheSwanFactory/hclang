"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hbWwvdGFnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsb0NBQW9GO0FBRXBGLElBQU0sT0FBTyxHQUFHLFVBQUMsTUFBYyxFQUFFLE1BQWM7SUFDN0MsTUFBTSxDQUFDLElBQUksa0JBQVMsQ0FBQztRQUNuQixJQUFJLG9CQUFXLENBQUMsTUFBTSxDQUFDO1FBQ3ZCLGlCQUFRLENBQUMsSUFBSSxFQUFFO1FBQ2YsSUFBSSxvQkFBVyxDQUFDLE1BQU0sQ0FBQztLQUN4QixDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFFVyxRQUFBLEdBQUcsR0FBRyxJQUFJLGtCQUFTLENBQUM7SUFDL0IsSUFBSSxrQkFBUyxDQUFDLEVBQUUsQ0FBQztJQUNqQixJQUFJLG1CQUFVLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztRQUNqQixpQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDakIsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7S0FDbkIsQ0FBQztDQUNILENBQUMsQ0FBQyJ9