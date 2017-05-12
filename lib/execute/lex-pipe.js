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
var syntax_1 = require("./syntax");
var LexPipe = (function (_super) {
    __extends(LexPipe, _super);
    function LexPipe(out) {
        var _this = this;
        syntax_1.syntax[LexPipe.kOUT] = out;
        _this = _super.call(this, syntax_1.syntax) || this;
        return _this;
    }
    LexPipe.prototype.lex_string = function (input) {
        var source = new frames_1.FrameString(input);
        return this.lex(source);
    };
    LexPipe.prototype.lex = function (source) {
        return source.reduce(this);
    };
    LexPipe.prototype.finish = function (argument) {
        var output = frames_1.FrameSymbol.end();
        var out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    };
    LexPipe.prototype.perform = function (actions) {
        var _this = this;
        var parser = this.get(LexPipe.kOUT);
        _.forEach(actions, function (value, key) {
            switch (key) {
                case "next": {
                    _this.finish(value);
                    break;
                }
                case "push": {
                    var next_parser = parser.push(value);
                    _this.set(LexPipe.kOUT, next_parser);
                    break;
                }
                case "pop": {
                    var next_parser = parser.pop(value);
                    _this.set(LexPipe.kOUT, next_parser);
                    break;
                }
            }
        });
        return this;
    };
    return LexPipe;
}(frames_1.Frame));
exports.LexPipe = LexPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXgtcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsb0NBQXFFO0FBRXJFLG1DQUFrQztBQUVsQztJQUE2QiwyQkFBSztJQUNoQyxpQkFBWSxHQUFVO1FBQXRCLGlCQUlDO1FBSEMsZUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFFM0IsUUFBQSxrQkFBTSxlQUFNLENBQUMsU0FBQzs7SUFDaEIsQ0FBQztJQUVNLDRCQUFVLEdBQWpCLFVBQWtCLEtBQWE7UUFDN0IsSUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxxQkFBRyxHQUFWLFVBQVcsTUFBbUI7UUFDNUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVNLHdCQUFNLEdBQWIsVUFBYyxRQUFlO1FBQzNCLElBQU0sTUFBTSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVNLHlCQUFPLEdBQWQsVUFBZSxPQUFnQjtRQUEvQixpQkFxQkM7UUFwQkMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFjLENBQUM7UUFDbkQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBQyxLQUFLLEVBQUUsR0FBRztZQUM1QixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNaLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQ1osS0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkIsS0FBSyxDQUFDO2dCQUNSLENBQUM7Z0JBQ0QsS0FBSyxNQUFNLEVBQUUsQ0FBQztvQkFDWixJQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN2QyxLQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBQ3BDLEtBQUssQ0FBQztnQkFDUixDQUFDO2dCQUNELEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQ1gsSUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdEMsS0FBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUNwQyxLQUFLLENBQUM7Z0JBQ1IsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUgsY0FBQztBQUFELENBQUMsQUE3Q0QsQ0FBNkIsY0FBSyxHQTZDakM7QUE3Q1ksMEJBQU8ifQ==