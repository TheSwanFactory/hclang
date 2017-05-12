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
    LexPipe.prototype.parser = function () {
        return this.get(LexPipe.kOUT);
    };
    LexPipe.prototype.finish = function (argument) {
        var output = frames_1.FrameSymbol.end();
        var out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    };
    LexPipe.prototype.perform = function (actions) {
        var _this = this;
        _.forEach(actions, function (value, key) {
            switch (key) {
                case "next": {
                    _this.next(value);
                }
                case "push": {
                    _this.push(value);
                }
                case "pop": {
                    _this.pop(value);
                }
            }
        });
        return this;
    };
    LexPipe.prototype.next = function (argument) {
        this.finish(argument);
        return this;
    };
    LexPipe.prototype.push = function (argument) {
        var next_parser = this.parser().push();
        this.set(LexPipe.kOUT, next_parser);
        return this;
    };
    LexPipe.prototype.pop = function (argument) {
        var next_parser = this.parser().pop();
        this.set(LexPipe.kOUT, next_parser);
        return this;
    };
    return LexPipe;
}(frames_1.Frame));
exports.LexPipe = LexPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXgtcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsb0NBQXFFO0FBRXJFLG1DQUFrQztBQUVsQztJQUE2QiwyQkFBSztJQUNoQyxpQkFBWSxHQUFVO1FBQXRCLGlCQUlDO1FBSEMsZUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFFM0IsUUFBQSxrQkFBTSxlQUFNLENBQUMsU0FBQzs7SUFDaEIsQ0FBQztJQUVNLDRCQUFVLEdBQWpCLFVBQWtCLEtBQWE7UUFDN0IsSUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxxQkFBRyxHQUFWLFVBQVcsTUFBbUI7UUFDNUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVNLHdCQUFNLEdBQWI7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFjLENBQUM7SUFDN0MsQ0FBQztJQUVNLHdCQUFNLEdBQWIsVUFBYyxRQUFlO1FBQzNCLElBQU0sTUFBTSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVNLHlCQUFPLEdBQWQsVUFBZSxPQUFnQjtRQUEvQixpQkFlQztRQWRDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQUMsS0FBSyxFQUFFLEdBQUc7WUFDNUIsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDWixLQUFLLE1BQU0sRUFBRSxDQUFDO29CQUNaLEtBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7Z0JBQ0QsS0FBSyxNQUFNLEVBQUUsQ0FBQztvQkFDWixLQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQixDQUFDO2dCQUNELEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQ1gsS0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEIsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sc0JBQUksR0FBWCxVQUFZLFFBQWU7UUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLHNCQUFJLEdBQVgsVUFBWSxRQUFlO1FBQ3pCLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxxQkFBRyxHQUFWLFVBQVcsUUFBZTtRQUN4QixJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0gsY0FBQztBQUFELENBQUMsQUEzREQsQ0FBNkIsY0FBSyxHQTJEakM7QUEzRFksMEJBQU8ifQ==