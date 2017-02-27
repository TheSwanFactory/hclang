"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_1 = require("./lex");
exports.ender = function (source, parameter) {
    var pipe = source;
    return pipe.finish();
};
var Terminal = (function (_super) {
    __extends(Terminal, _super);
    function Terminal(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        _this.callme = true;
        return _this;
    }
    Terminal.end = function () { return new Terminal(exports.ender); };
    ;
    Terminal.prototype.apply = function (argument, parameter) {
        return this.data(argument, parameter);
    };
    Terminal.prototype.toData = function () { return this.data; };
    return Terminal;
}(frames_1.Frame));
exports.Terminal = Terminal;
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
exports.terminals = {
    " ": new LexSpace(),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdGVybWluYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUEyRTtBQUUzRSw2QkFBNEI7QUFHZixRQUFBLEtBQUssR0FBbUIsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7SUFDbkUsSUFBTSxJQUFJLEdBQUcsTUFBaUIsQ0FBQztJQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUVGO0lBQThCLDRCQUFLO0lBR2pDLGtCQUFzQixJQUFvQjtRQUExQyxZQUNFLGtCQUFNLGFBQUksQ0FBQyxTQUVaO1FBSHFCLFVBQUksR0FBSixJQUFJLENBQWdCO1FBRXhDLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDOztJQUNyQixDQUFDO0lBTGEsWUFBRyxHQUFqQixjQUFzQixNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsYUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQU83Qyx3QkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRVMseUJBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLGVBQUM7QUFBRCxDQUFDLEFBYkQsQ0FBOEIsY0FBSyxHQWFsQztBQWJZLDRCQUFRO0FBZXJCO0lBQThCLDRCQUFHO0lBQWpDOztJQUlBLENBQUM7SUFIVyx3QkFBSyxHQUFmLFVBQWdCLElBQVksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFNUMsNEJBQVMsR0FBbkIsY0FBd0IsTUFBTSxDQUFDLG9CQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxlQUFDO0FBQUQsQ0FBQyxBQUpELENBQThCLFNBQUcsR0FJaEM7QUFKWSw0QkFBUTtBQUlwQixDQUFDO0FBRVcsUUFBQSxTQUFTLEdBQVk7SUFDaEMsR0FBRyxFQUFFLElBQUksUUFBUSxFQUFFO0NBQ3BCLENBQUMifQ==