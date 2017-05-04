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
var frames_1 = require("../frames");
var terminals_1 = require("./terminals");
var Token = (function (_super) {
    __extends(Token, _super);
    function Token(data) {
        var _this = _super.call(this, frames_1.NilContext) || this;
        _this.data = data;
        return _this;
    }
    Token.prototype.called_by = function (callee, parameter) {
        return callee.apply(this.data, parameter);
    };
    Token.prototype.toData = function () { return this.data; };
    return Token;
}(frames_1.FrameAtom));
exports.Token = Token;
var Lex = (function (_super) {
    __extends(Lex, _super);
    function Lex(factory) {
        var _this = _super.call(this) || this;
        _this.factory = factory;
        _this.body = "";
        _this.sample = new factory("");
        _this.source = "";
        return _this;
    }
    Lex.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frames_1.Frame.nil; }
        var char = argument.toString();
        if (this.isEnd(char) && this.isTerminal(char)) {
            return this.finish(argument, true);
        }
        if (this.isEnd(char)) {
            return this.finish(argument, !this.isQuote());
        }
        if (this.isTerminal(char) && !this.isQuote()) {
            return this.finish(argument, true);
        }
        if (this.body === "") {
            this.body = this.source;
        }
        this.body = this.body + argument.toString();
        return this;
    };
    Lex.prototype.getClassName = function () {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec(this.constructor.toString());
        return (results && results.length > 1) ? results[1] : "<class>";
    };
    Lex.prototype.toString = function () {
        return this.getClassName() + ("[" + this.body + "]");
    };
    Lex.prototype.isEnd = function (char) {
        return !this.sample.canInclude(char);
    };
    Lex.prototype.isTerminal = function (char) {
        var terms = _.keys(terminals_1.terminals);
        return _.includes(terms, char);
    };
    Lex.prototype.isQuote = function () {
        return (this.sample instanceof frames_1.FrameQuote);
    };
    Lex.prototype.finish = function (argument, passAlong) {
        this.exportFrame();
        if (passAlong) {
            var result = this.up.call(argument);
            return result;
        }
        return this.up;
    };
    Lex.prototype.exportFrame = function () {
        var output = this.makeFrame();
        var out = this.get(frames_1.Frame.kOUT);
        this.body = "";
        return out.call(output);
    };
    Lex.prototype.makeFrame = function () {
        var frame = new this.factory(this.body);
        return new Token(frame);
    };
    return Lex;
}(frames_1.Frame));
exports.Lex = Lex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QixvQ0FBNEY7QUFDNUYseUNBQXdDO0FBSXhDO0lBQTJCLHlCQUFTO0lBQ2xDLGVBQXNCLElBQVc7UUFBakMsWUFDRSxrQkFBTSxtQkFBVSxDQUFDLFNBQ2xCO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQU87O0lBRWpDLENBQUM7SUFFTSx5QkFBUyxHQUFoQixVQUFpQixNQUFhLEVBQUUsU0FBZ0I7UUFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsc0JBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLFlBQUM7QUFBRCxDQUFDLEFBVkQsQ0FBMkIsa0JBQVMsR0FVbkM7QUFWWSxzQkFBSztBQVlsQjtJQUF5Qix1QkFBSztJQU01QixhQUE2QixPQUFZO1FBQXpDLFlBQ0UsaUJBQU8sU0FHUjtRQUo0QixhQUFPLEdBQVAsT0FBTyxDQUFLO1FBSC9CLFVBQUksR0FBVyxFQUFFLENBQUM7UUFLMUIsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5QixLQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQzs7SUFDbkIsQ0FBQztJQUVNLGtCQUFJLEdBQVgsVUFBWSxRQUFlLEVBQUUsU0FBcUI7UUFBckIsMEJBQUEsRUFBQSxZQUFZLGNBQUssQ0FBQyxHQUFHO1FBQ2hELElBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FB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