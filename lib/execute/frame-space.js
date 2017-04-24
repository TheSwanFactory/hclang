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
var frame = require("../frames");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3BhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9mcmFtZS1zcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBbUM7QUFFbkM7SUFBZ0MsOEJBQWU7SUFBL0M7O0lBWUEsQ0FBQztJQVRRLGlDQUFZLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFakQsK0JBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUM1QixNQUFNLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxVQUFVLENBQUM7SUFDeEMsQ0FBQztJQUVNLDJCQUFNLEdBQWI7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQVpELENBQWdDLEtBQUssQ0FBQyxTQUFTO0FBQ3RCLHFCQUFVLEdBQUcsR0FBRyxDQUFDO0FBRDdCLGdDQUFVO0FBWXRCLENBQUMifQ==