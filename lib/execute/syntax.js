"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var frame = require("../frames");
var frame_space_1 = require("./frame-space");
var lex_1 = require("./lex");
var terminals_1 = require("./terminals");
var tokenFrames = [
    frame_space_1.FrameSpace,
    frame.FrameComment,
    frame.FrameDoc,
    frame.FrameName,
    frame.FrameNumber,
    frame.FrameString,
    frame.FrameSymbol,
];
_.map(tokenFrames, function (klass) {
    var sample = new klass("");
    var key = sample.string_start();
    terminals_1.terminals[key] = new lex_1.Lex(klass);
});
exports.syntax = terminals_1.terminals;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMEJBQTRCO0FBQzVCLGlDQUFtQztBQUNuQyw2Q0FBMkM7QUFDM0MsNkJBQTRCO0FBQzVCLHlDQUFrRDtBQUVsRCxJQUFNLFdBQVcsR0FBZTtJQUM5Qix3QkFBVTtJQUNWLEtBQUssQ0FBQyxZQUFZO0lBQ2xCLEtBQUssQ0FBQyxRQUFRO0lBQ2QsS0FBSyxDQUFDLFNBQVM7SUFDZixLQUFLLENBQUMsV0FBVztJQUNqQixLQUFLLENBQUMsV0FBVztJQUNqQixLQUFLLENBQUMsV0FBVztDQUNsQixDQUFDO0FBRUYsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsVUFBQyxLQUFVO0lBQzVCLElBQU0sTUFBTSxHQUFvQixJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM5QyxJQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDbEMscUJBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMsQ0FBQztBQUVVLFFBQUEsTUFBTSxHQUFrQixxQkFBUyxDQUFDIn0=