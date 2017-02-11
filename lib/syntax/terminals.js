"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var LexSpace = (function (_super) {
    __extends(LexSpace, _super);
    function LexSpace() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LexSpace.prototype.isEnd = function (char) { return char !== " "; };
    LexSpace.prototype.makeFrame = function () { return frames_1.FrameSymbol.for(""); };
    return LexSpace;
}(lex_1.Lex));
exports.LexSpace = LexSpace;
;
exports.terminals = {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N5bnRheC90ZXJtaW5hbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0NBQXFFO0FBQ3JFLDZCQUE0QjtBQUc1QjtJQUE4Qiw0QkFBRztJQUFqQzs7SUFJQSxDQUFDO0lBSFcsd0JBQUssR0FBZixVQUFnQixJQUFZLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTVDLDRCQUFTLEdBQW5CLGNBQXdCLE1BQU0sQ0FBQyxvQkFBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQsZUFBQztBQUFELENBQUMsQUFKRCxDQUE4QixTQUFHLEdBSWhDO0FBSlksNEJBQVE7QUFJcEIsQ0FBQztBQUVXLFFBQUEsU0FBUyxHQUFZLEVBRWpDLENBQUMifQ==