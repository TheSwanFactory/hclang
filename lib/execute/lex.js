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
        var _this = _super.call(this, frames_1.Void) || this;
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
        return _this;
    }
    Lex.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frames_1.Frame.nil; }
        var char = argument.toString();
        if (this.isEnd(char)) {
            return this.finish(argument, this.pass_on);
        }
        if (this.isTerminal(char) && !this.isQuoting()) {
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
        return false;
    };
    Lex.prototype.isTerminal = function (char) {
        var terms = _.keys(terminals_1.terminals);
        return _.includes(terms, char);
    };
    Lex.prototype.isQuoting = function () {
        return false;
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
        if (this.factory === frames_1.Frame.nil) {
            return frames_1.Frame.nil;
        }
        var frame = new this.factory(this.body);
        return new Token(frame);
    };
    return Lex;
}(frames_1.Frame));
exports.Lex = Lex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QixvQ0FBbUQ7QUFDbkQseUNBQXdDO0FBRXhDO0lBQTJCLHlCQUFTO0lBQ2xDLGVBQXNCLElBQVc7UUFBakMsWUFDRSxrQkFBTSxhQUFJLENBQUMsU0FDWjtRQUZxQixVQUFJLEdBQUosSUFBSSxDQUFPOztJQUVqQyxDQUFDO0lBRU0seUJBQVMsR0FBaEIsVUFBaUIsTUFBYSxFQUFFLFNBQWdCO1FBQzlDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNTLHNCQUFNLEdBQWhCLGNBQTBCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvQyxZQUFDO0FBQUQsQ0FBQyxBQVRELENBQTJCLGtCQUFTLEdBU25DO0FBVFksc0JBQUs7QUFXbEI7SUFBeUIsdUJBQUs7SUFLNUIsYUFBZ0MsT0FBWTtRQUE1QyxZQUNFLGlCQUFPLFNBQ1I7UUFGK0IsYUFBTyxHQUFQLE9BQU8sQ0FBSztRQUhsQyxVQUFJLEdBQVcsRUFBRSxDQUFDO1FBQ2xCLGFBQU8sR0FBRyxLQUFLLENBQUM7O0lBSTFCLENBQUM7SUFFTSxrQkFBSSxHQUFYLFVBQVksUUFBZSxFQUFFLFNBQXFCO1FBQXJCLDBCQUFBLEVBQUEsWUFBWSxjQUFLLENBQUMsR0FBRztRQUNoRCxJQUFNLElBQUksR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sMEJBQVksR0FBbkI7UUFDRSxJQUFNLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQztRQUMzQyxJQUFNLE9BQU8sR0FBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDbkUsTUFBTSxDQUFDLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUNsRSxDQUFDO0lBRU0sc0JBQVEsR0FBZjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUcsTUFBSSxJQUFJLENBQUMsSUFBSSxNQUFHLENBQUEsQ0FBQztJQUNoRCxDQUFDO0lBRVMsbUJBQUssR0FBZixVQUFnQixJQUFZO1FBQzFCLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRVMsd0JBQVUsR0FBcEIsVUFBcUIsSUFBWTtRQUMvQixJQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFTLENBQUMsQ0FBQztRQUNoQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVTLHVCQUFTLEdBQW5CO1FBQ0UsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFUyxvQkFBTSxHQUFoQixVQUFpQixRQUFlLEVBQUUsSUFBYTtRQUM3QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNULElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDaEIsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFUyx5QkFBVyxHQUFyQjtRQUNFLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNoQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVmLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFUyx1QkFBUyxHQUFuQjtRQUNFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssY0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLGNBQUssQ0FBQyxHQUFHLENBQUM7UUFDbkIsQ0FBQztRQUNELElBQU0sS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDSCxVQUFDO0FBQUQsQ0FBQyxBQXJFRCxDQUF5QixjQUFLLEdBcUU3QjtBQXJFWSxrQkFBRyJ9