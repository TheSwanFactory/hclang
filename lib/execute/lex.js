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
    function Lex(factory, flags) {
        if (flags === void 0) { flags = {}; }
        var _this = _super.call(this) || this;
        _this.factory = factory;
        _this.flags = flags;
        _this.body = "";
        _this.pass_on = false;
        if (!factory.is_nil) {
            _this.sample = new factory("");
        }
        return _this;
    }
    Lex.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frames_1.Frame.nil; }
        var char = argument.toString();
        if (this.isEnd(char)) {
            return this.finish(argument, this.flags.passAlong);
        }
        if (this.isTerminal(char) && !this.flags.isQuote) {
            return this.finish(argument, true);
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
    Lex.prototype.finish = function (argument, pass) {
        this.exportFrame();
        if (pass) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QixvQ0FBeUQ7QUFDekQseUNBQXdDO0FBSXhDO0lBQTJCLHlCQUFTO0lBQ2xDLGVBQXNCLElBQVc7UUFBakMsWUFDRSxrQkFBTSxtQkFBVSxDQUFDLFNBQ2xCO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQU87O0lBRWpDLENBQUM7SUFFTSx5QkFBUyxHQUFoQixVQUFpQixNQUFhLEVBQUUsU0FBZ0I7UUFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsc0JBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLFlBQUM7QUFBRCxDQUFDLEFBVkQsQ0FBMkIsa0JBQVMsR0FVbkM7QUFWWSxzQkFBSztBQVlsQjtJQUF5Qix1QkFBSztJQU01QixhQUE2QixPQUFZLEVBQVksS0FBZ0I7UUFBaEIsc0JBQUEsRUFBQSxVQUFnQjtRQUFyRSxZQUNFLGlCQUFPLFNBSVI7UUFMNEIsYUFBTyxHQUFQLE9BQU8sQ0FBSztRQUFZLFdBQUssR0FBTCxLQUFLLENBQVc7UUFKM0QsVUFBSSxHQUFXLEVBQUUsQ0FBQztRQUNsQixhQUFPLEdBQUcsS0FBSyxDQUFDO1FBS3hCLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDcEIsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNoQyxDQUFDOztJQUNILENBQUM7SUFFTSxrQkFBSSxHQUFYLFVBQVksUUFBZSxFQUFFLFNBQXFCO1FBQXJCLDBCQUFBLEVBQUEsWUFBWSxjQUFLLENBQUMs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