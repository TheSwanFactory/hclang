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
var frames_1 = require("../frames");
var syntax_1 = require("./syntax");
var LexTerminal = (function (_super) {
    __extends(LexTerminal, _super);
    function LexTerminal(options) {
        var _this = _super.call(this, frames_1.NilContext) || this;
        _this.options = options;
        _this.callme = true;
        return _this;
    }
    LexTerminal.prototype.apply = function (argument, parameter) {
        var source = argument;
        return source.terminate(this.options);
    };
    return LexTerminal;
}(frames_1.Frame));
var Lexer = (function (_super) {
    __extends(Lexer, _super);
    function Lexer(out) {
        var _this = this;
        syntax_1.syntax[Lexer.kOUT] = out;
        _this = _super.call(this, syntax_1.syntax) || this;
        return _this;
    }
    Lexer.prototype.lex_string = function (input) {
        var source = new frames_1.FrameString(input);
        return this.lex(source);
    };
    Lexer.prototype.lex = function (source) {
        return source.reduce(this);
    };
    Lexer.prototype.fold = function (argument) {
        var out = this.get(frames_1.Frame.kOUT);
        this.set(frames_1.Frame.kOUT, out.call(argument));
    };
    Lexer.prototype.terminate = function (parameter) {
        return frames_1.Frame.nil;
    };
    return Lexer;
}(frames_1.Frame));
exports.Lexer = Lexer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSxvQ0FBaUY7QUFHakYsbUNBQWtDO0FBRWxDO0lBQTBCLCtCQUFLO0lBQzdCLHFCQUFzQixPQUFjO1FBQXBDLFlBQ0Usa0JBQU0sbUJBQVUsQ0FBQyxTQUVsQjtRQUhxQixhQUFPLEdBQVAsT0FBTyxDQUFPO1FBRWxDLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDOztJQUNyQixDQUFDO0lBRU0sMkJBQUssR0FBWixVQUFhLFFBQWUsRUFBRSxTQUFnQjtRQUM1QyxJQUFNLE1BQU0sR0FBRyxRQUFpQixDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBQ0gsa0JBQUM7QUFBRCxDQUFDLEFBVkQsQ0FBMEIsY0FBSyxHQVU5QjtBQUVEO0lBQTJCLHlCQUFLO0lBQzlCLGVBQVksR0FBVTtRQUF0QixpQkFHQztRQUZDLGVBQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ3pCLFFBQUEsa0JBQU0sZUFBTSxDQUFDLFNBQUM7O0lBQ2hCLENBQUM7SUFFTSwwQkFBVSxHQUFqQixVQUFrQixLQUFhO1FBQzdCLElBQU0sTUFBTSxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRU0sbUJBQUcsR0FBVixVQUFXLE1BQW1CO1FBQzVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFTSxvQkFBSSxHQUFYLFVBQVksUUFBZTtRQUN6QixJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFTSx5QkFBUyxHQUFoQixVQUFpQixTQUFnQjtRQUMvQixNQUFNLENBQUMsY0FBSyxDQUFDLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBQ0gsWUFBQztBQUFELENBQUMsQUF2QkQsQ0FBMkIsY0FBSyxHQXVCL0I7QUF2Qlksc0JBQUsifQ==