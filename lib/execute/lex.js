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
        _this.pass_on = false;
        _this.sample = new factory("");
        return _this;
    }
    Lex.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frames_1.Frame.nil; }
        var char = argument.toString();
        if (this.isEnd(char)) {
            return this.finish(argument, !this.isQuote());
        }
        if (this.isTerminal(char) && !this.isQuote()) {
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
    Lex.prototype.isQuote = function () {
        return (this.sample instanceof frames_1.FrameString);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QixvQ0FBc0U7QUFDdEUseUNBQXdDO0FBSXhDO0lBQTJCLHlCQUFTO0lBQ2xDLGVBQXNCLElBQVc7UUFBakMsWUFDRSxrQkFBTSxtQkFBVSxDQUFDLFNBQ2xCO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQU87O0lBRWpDLENBQUM7SUFFTSx5QkFBUyxHQUFoQixVQUFpQixNQUFhLEVBQUUsU0FBZ0I7UUFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsc0JBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLFlBQUM7QUFBRCxDQUFDLEFBVkQsQ0FBMkIsa0JBQVMsR0FVbkM7QUFWWSxzQkFBSztBQVlsQjtJQUF5Qix1QkFBSztJQU01QixhQUE2QixPQUFZO1FBQXpDLFlBQ0UsaUJBQU8sU0FFUjtRQUg0QixhQUFPLEdBQVAsT0FBTyxDQUFLO1FBSi9CLFVBQUksR0FBVyxFQUFFLENBQUM7UUFDbEIsYUFBTyxHQUFHLEtBQUssQ0FBQztRQUt4QixLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztJQUNoQyxDQUFDO0lBRU0sa0JBQUksR0FBWCxVQUFZLFFBQWUsRUFBRSxTQUFxQjtRQUFyQiwwQkFBQSxFQUFBLFlBQVksY0FBSyxDQUFDLEdBQUc7UUFDaEQsSUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE1B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