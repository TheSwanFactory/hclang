"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var frame = require("../frames");
var lex_1 = require("./lex");
var terminals_1 = require("./terminals");
var FrameSpace = (function (_super) {
    __extends(FrameSpace, _super);
    function FrameSpace() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FrameSpace.prototype.string_start = function () { return FrameSpace.SPACE_CHAR; };
    ;
    FrameSpace.prototype.canInclude = function (char) {
        return char === FrameSpace.SPACE_CHAR;
    };
    FrameSpace.prototype.isVoid = function () {
        return true;
    };
    return FrameSpace;
}(frame.FrameAtom));
FrameSpace.SPACE_CHAR = " ";
exports.FrameSpace = FrameSpace;
;
var tokenFrames = [
    FrameSpace,
    frame.FrameComment,
    frame.FrameString,
];
_.map(tokenFrames, function (klass) {
    var sample = new klass("");
    var key = sample.string_start();
    terminals_1.terminals[key] = new lex_1.Lex(klass);
});
exports.syntax = terminals_1.terminals;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvc3ludGF4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QixpQ0FBbUM7QUFDbkMsNkJBQTRCO0FBQzVCLHlDQUFrRDtBQUVsRDtJQUFnQyw4QkFBZTtJQUEvQzs7SUFZQSxDQUFDO0lBVFEsaUNBQVksR0FBbkIsY0FBd0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVqRCwrQkFBVSxHQUFqQixVQUFrQixJQUFZO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLFVBQVUsQ0FBQztJQUN4QyxDQUFDO0lBRU0sMkJBQU0sR0FBYjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBWkQsQ0FBZ0MsS0FBSyxDQUFDLFNBQVM7QUFDdEIscUJBQVUsR0FBRyxHQUFHLENBQUM7QUFEN0IsZ0NBQVU7QUFZdEIsQ0FBQztBQUVGLElBQU0sV0FBVyxHQUFHO0lBQ2xCLFVBQVU7SUFDVixLQUFLLENBQUMsWUFBWTtJQUNsQixLQUFLLENBQUMsV0FBVztDQUNsQixDQUFDO0FBRUYsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsVUFBQyxLQUFVO0lBQzVCLElBQU0sTUFBTSxHQUFvQixJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM5QyxJQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDbEMscUJBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMsQ0FBQztBQUVVLFFBQUEsTUFBTSxHQUFrQixxQkFBUyxDQUFDIn0=