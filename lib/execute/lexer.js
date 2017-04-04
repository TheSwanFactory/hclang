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
    Lexer.prototype.parser = function () {
        return this.get(Lexer.kOUT);
    };
    Lexer.prototype.finish = function () {
        var output = frames_1.FrameSymbol.end();
        var out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    };
    Lexer.prototype.next = function () {
        this.finish();
        return this;
    };
    return Lexer;
}(frames_1.Frame));
exports.Lexer = Lexer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSxvQ0FBcUU7QUFFckUsbUNBQWtDO0FBRWxDO0lBQTJCLHlCQUFLO0lBQzlCLGVBQVksR0FBVTtRQUF0QixpQkFJQztRQUhDLGVBQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBRXpCLFFBQUEsa0JBQU0sZUFBTSxDQUFDLFNBQUM7O0lBQ2hCLENBQUM7SUFFTSwwQkFBVSxHQUFqQixVQUFrQixLQUFhO1FBQzdCLElBQU0sTUFBTSxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRU0sbUJBQUcsR0FBVixVQUFXLE1BQW1CO1FBQzVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFTSxzQkFBTSxHQUFiO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBYyxDQUFDO0lBQzNDLENBQUM7SUFFTSxzQkFBTSxHQUFiO1FBQ0UsSUFBTSxNQUFNLEdBQUcsb0JBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNqQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRU0sb0JBQUksR0FBWDtRQUNFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0gsWUFBQztBQUFELENBQUMsQUE5QkQsQ0FBMkIsY0FBSyxHQThCL0I7QUE5Qlksc0JBQUsifQ==