"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const frame = __importStar(require("../frames"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDBDQUEyQjtBQUMzQixpREFBa0M7QUFDbEMsK0NBQTBDO0FBQzFDLCtCQUEyQjtBQUMzQiwyQ0FBdUM7QUFFMUIsUUFBQSxNQUFNLEdBQWtCLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQVMsQ0FBQyxDQUFBO0FBRXZELE1BQU0sV0FBVyxHQUFlO0lBQzlCLHdCQUFVO0lBQ1YsS0FBSyxDQUFDLFVBQVU7SUFDaEIsS0FBSyxDQUFDLFFBQVE7SUFDZCxLQUFLLENBQUMsU0FBUztJQUNmLEtBQUssQ0FBQyxVQUFVO0lBQ2hCLEtBQUssQ0FBQyxZQUFZO0lBQ2xCLEtBQUssQ0FBQyxRQUFRO0lBQ2QsS0FBSyxDQUFDLFNBQVM7SUFDZixLQUFLLENBQUMsU0FBUztJQUNmLEtBQUssQ0FBQyxXQUFXO0lBQ2pCLEtBQUssQ0FBQyxhQUFhO0lBQ25CLEtBQUssQ0FBQyxXQUFXO0lBQ2pCLEtBQUssQ0FBQyxXQUFXO0NBQ2xCLENBQUE7QUFFRCxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQVUsRUFBRSxFQUFFO0lBQ2hDLE1BQU0sTUFBTSxHQUFvQixJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUM3QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUE7SUFDakMsY0FBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzlCLENBQUMsQ0FBQyxDQUFBIn0=