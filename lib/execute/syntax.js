"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frame = require("../frames");
const frame_space_1 = require("./frame-space");
const lex_1 = require("./lex");
const terminals_1 = require("./terminals");
exports.syntax = _.clone(terminals_1.terminals);
const tokenFrames = [
    frame_space_1.FrameSpace,
    frame.FrameComment,
    frame.FrameDoc,
    frame.FrameName,
    frame.FrameNumber,
    frame.FrameString,
    frame.FrameSymbol,
];
const add_range = (key, klass) => {
    return false;
};
_.map(tokenFrames, (klass) => {
    const sample = new klass("");
    const key = sample.string_start();
    if (!add_range(key, klass)) {
        exports.syntax[key] = new lex_1.Lex(klass);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLG1DQUFtQztBQUNuQywrQ0FBMkM7QUFDM0MsK0JBQTRCO0FBQzVCLDJDQUF3QztBQUUzQixRQUFBLE1BQU0sR0FBa0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxxQkFBUyxDQUFDLENBQUM7QUFFeEQsTUFBTSxXQUFXLEdBQWU7SUFDOUIsd0JBQVU7SUFDVixLQUFLLENBQUMsWUFBWTtJQUNsQixLQUFLLENBQUMsUUFBUTtJQUNkLEtBQUssQ0FBQyxTQUFTO0lBQ2YsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLFdBQVc7SUFDakIsS0FBSyxDQUFDLFdBQVc7Q0FDbEIsQ0FBQztBQUVGLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBVyxFQUFFLEtBQVUsRUFBVyxFQUFFO0lBQ3JELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyxDQUFDO0FBRUYsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFVLEVBQUUsRUFBRTtJQUNoQyxNQUFNLE1BQU0sR0FBb0IsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDOUMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFO1FBQzFCLGNBQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM5QjtBQUNILENBQUMsQ0FBQyxDQUFDIn0=