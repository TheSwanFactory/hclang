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
    frame.FrameAlias,
    frame.FrameArg,
    frame.FrameBlob,
    frame.FrameBytes,
    frame.FrameComment,
    frame.FrameDoc,
    frame.FrameName,
    frame.FrameNote,
    frame.FrameNumber,
    frame.FrameOperator,
    frame.FrameString,
    frame.FrameSymbol,
];
_.map(atomClasses, (klass) => {
    const sample = new klass("");
    const key = sample.string_start();
    exports.syntax[key] = new lex_1.Lex(klass);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLG1DQUFtQztBQUNuQywrQ0FBMkM7QUFDM0MsK0JBQTRCO0FBQzVCLDJDQUF3QztBQUUzQixRQUFBLE1BQU0sR0FBa0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQkFBUyxDQUFDLENBQUM7QUFFeEQsTUFBTSxXQUFXLEdBQWU7SUFDOUIsd0JBQVU7SUFDVixLQUFLLENBQUMsVUFBVTtJQUNoQixLQUFLLENBQUMsUUFBUTtJQUNkLEtBQUssQ0FBQyxTQUFTO0lBQ2YsS0FBSyxDQUFDLFVBQVU7SUFDaEIsS0FBSyxDQUFDLFlBQVk7SUFDbEIsS0FBSyxDQUFDLFFBQVE7SUFDZCxLQUFLLENBQUMsU0FBUztJQUNmLEtBQUssQ0FBQyxTQUFTO0lBQ2YsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLGFBQWE7SUFDbkIsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLFdBQVc7Q0FDbEIsQ0FBQztBQUVGLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUU7SUFDaEMsTUFBTSxNQUFNLEdBQW9CLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNsQyxjQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMifQ==