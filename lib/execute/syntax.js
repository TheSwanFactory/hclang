"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frame = require("../frames");
const frame_space_1 = require("./frame-space");
const lex_1 = require("./lex");
const terminals_1 = require("./terminals");
exports.syntax = _.clone(terminals_1.terminals);
const atomClasses = [
    frame_space_1.FrameSpace,
    frame.FrameComment,
    frame.FrameDoc,
    frame.FrameName,
    frame.FrameNumber,
    frame.FrameString,
    frame.FrameSymbol,
];
const listClasses = [];
_.map(atomClasses, (klass) => {
    const sample = new klass("");
    const key = sample.string_start();
    exports.syntax[key] = new lex_1.Lex(klass);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLG1DQUFtQztBQUNuQywrQ0FBMkM7QUFDM0MsK0JBQTRCO0FBQzVCLDJDQUF3QztBQUUzQixRQUFBLE1BQU0sR0FBa0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQkFBUyxDQUFDLENBQUM7QUFFeEQsTUFBTSxXQUFXLEdBQWU7SUFDOUIsd0JBQVU7SUFFVixLQUFLLENBQUMsWUFBWTtJQUNsQixLQUFLLENBQUMsUUFBUTtJQUNkLEtBQUssQ0FBQyxTQUFTO0lBRWYsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLFdBQVc7Q0FDbEIsQ0FBQztBQUVGLE1BQU0sV0FBVyxHQUFlLEVBQy9CLENBQUM7QUFFRixDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQVUsRUFBRSxFQUFFO0lBQ2hDLE1BQU0sTUFBTSxHQUFvQixJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM5QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDbEMsY0FBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDIn0=