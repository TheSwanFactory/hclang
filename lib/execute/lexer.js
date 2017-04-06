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
var FrameStatement = (function () {
    function FrameStatement() {
    }
    return FrameStatement;
}());
exports.FrameStatement = FrameStatement;
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
        var options = parameter;
        return source.finish(options);
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
    Lexer.prototype.finish = function (options) {
        return frames_1.Frame.nil;
    };
    return Lexer;
}(frames_1.Frame));
exports.Lexer = Lexer;
var parameter = {
    pop: frames_1.FrameGroup,
    push: frames_1.FrameGroup,
    wrap: FrameStatement,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSxvQ0FBZ0Y7QUFHaEYsbUNBQWtDO0FBSWxDO0lBQUE7SUFFQSxDQUFDO0lBQUQscUJBQUM7QUFBRCxDQUFDLEFBRkQsSUFFQztBQUZZLHdDQUFjO0FBRzNCO0lBQTBCLCtCQUFLO0lBQzdCLHFCQUFzQixPQUFtQjtRQUF6QyxZQUNFLGtCQUFNLG1CQUFVLENBQUMsU0FFbEI7UUFIcUIsYUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUV2QyxLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzs7SUFDckIsQ0FBQztJQUVNLDJCQUFLLEdBQVosVUFBYSxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsSUFBTSxNQUFNLEdBQUcsUUFBaUIsQ0FBQztRQUNqQyxJQUFNLE9BQU8sR0FBRyxTQUF1QixDQUFDO1FBQ3hDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFDSCxrQkFBQztBQUFELENBQUMsQUFYRCxDQUEwQixjQUFLLEdBVzlCO0FBRUQ7SUFBMkIseUJBQUs7SUFDOUIsZUFBWSxHQUFVO1FBQXRCLGlCQUdDO1FBRkMsZUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDekIsUUFBQSxrQkFBTSxlQUFNLENBQUMsU0FBQzs7SUFDaEIsQ0FBQztJQUVNLDBCQUFVLEdBQWpCLFVBQWtCLEtBQWE7UUFDN0IsSUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxtQkFBRyxHQUFWLFVBQVcsTUFBbUI7UUFDNUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVNLG9CQUFJLEdBQVgsVUFBWSxRQUFlO1FBQ3pCLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVNLHNCQUFNLEdBQWIsVUFBYyxPQUFtQjtRQUMvQixNQUFNLENBQUMsY0FBSyxDQUFDLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBQ0gsWUFBQztBQUFELENBQUMsQUF2QkQsQ0FBMkIsY0FBSyxHQXVCL0I7QUF2Qlksc0JBQUs7QUF5QmxCLElBQU0sU0FBUyxHQUFlO0lBQzVCLEdBQUcsRUFBRSxtQkFBVTtJQUNmLElBQUksRUFBRSxtQkFBVTtJQUNoQixJQUFJLEVBQUUsY0FBYztDQUNyQixDQUFDIn0=