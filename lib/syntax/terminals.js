"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
var LexTerminal = (function (_super) {
    __extends(LexTerminal, _super);
    function LexTerminal(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        _this.callme = true;
        return _this;
    }
    LexTerminal.prototype.apply = function (argument, parameter) {
        return this.data(argument, parameter);
    };
    LexTerminal.prototype.toData = function () { return this.data; };
    return LexTerminal;
}(frames_1.Frame));
exports.LexTerminal = LexTerminal;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N5bnRheC90ZXJtaW5hbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0NBQTJFO0FBRTNFLDZCQUE0QjtBQUU1QjtJQUFpQywrQkFBSztJQUNwQyxxQkFBc0IsSUFBb0I7UUFBMUMsWUFDRSxrQkFBTSxhQUFJLENBQUMsU0FFWjtRQUhxQixVQUFJLEdBQUosSUFBSSxDQUFnQjtRQUV4QyxLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzs7SUFDckIsQ0FBQztJQUVNLDJCQUFLLEdBQVosVUFBYSxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFUyw0QkFBTSxHQUFoQixjQUEwQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0Msa0JBQUM7QUFBRCxDQUFDLEFBWEQsQ0FBaUMsY0FBSyxHQVdyQztBQVhZLGtDQUFXO0FBYXhCO0lBQThCLDRCQUFHO0lBQWpDOztJQUlBLENBQUM7SUFIVyx3QkFBSyxHQUFmLFVBQWdCLElBQVksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFNUMsNEJBQVMsR0FBbkIsY0FBd0IsTUFBTSxDQUFDLG9CQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxlQUFDO0FBQUQsQ0FBQyxBQUpELENBQThCLFNBQUcsR0FJaEM7QUFKWSw0QkFBUTtBQUlwQixDQUFDO0FBRVcsUUFBQSxTQUFTLEdBQVksRUFFakMsQ0FBQyJ9