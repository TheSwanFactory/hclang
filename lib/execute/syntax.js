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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMEJBQTRCO0FBQzVCLGlDQUFtQztBQUNuQyw2Q0FBMkM7QUFDM0MsNkJBQTRCO0FBQzVCLHlDQUFrRDtBQUVsRCxJQUFNLFdBQVcsR0FBZTtJQUM5Qix3QkFBVTtJQUNWLEtBQUssQ0FBQyxZQUFZO0lBQ2xCLEtBQUssQ0FBQyxTQUFTO0lBQ2YsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLFdBQVc7Q0FDbEIsQ0FBQztBQUVGLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFVBQUMsS0FBVTtJQUM1QixJQUFNLE1BQU0sR0FBb0IsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDOUMsSUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ2xDLHFCQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbEMsQ0FBQyxDQUFDLENBQUM7QUFFVSxRQUFBLE1BQU0sR0FBa0IscUJBQVMsQ0FBQyJ9