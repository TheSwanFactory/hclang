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
    frame.FrameSymbol
];
_.map(atomClasses, (Klass) => {
    const sample = new Klass('');
    const key = sample.string_start();
    exports.syntax[key] = new lex_1.Lex(Klass);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTJCO0FBQzNCLG1DQUFrQztBQUNsQywrQ0FBMEM7QUFDMUMsK0JBQTJCO0FBQzNCLDJDQUF1QztBQUUxQixRQUFBLE1BQU0sR0FBa0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQkFBUyxDQUFDLENBQUE7QUFFdkQsTUFBTSxXQUFXLEdBQWU7SUFDOUIsd0JBQVU7SUFDVixLQUFLLENBQUMsVUFBVTtJQUNoQixLQUFLLENBQUMsUUFBUTtJQUNkLEtBQUssQ0FBQyxTQUFTO0lBQ2YsS0FBSyxDQUFDLFVBQVU7SUFDaEIsS0FBSyxDQUFDLFlBQVk7SUFDbEIsS0FBSyxDQUFDLFFBQVE7SUFDZCxLQUFLLENBQUMsU0FBUztJQUNmLEtBQUssQ0FBQyxTQUFTO0lBQ2YsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLGFBQWE7SUFDbkIsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLFdBQVc7Q0FDbEIsQ0FBQTtBQUVELENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUU7SUFDaEMsTUFBTSxNQUFNLEdBQW9CLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQzdDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQTtJQUNqQyxjQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDOUIsQ0FBQyxDQUFDLENBQUEifQ==