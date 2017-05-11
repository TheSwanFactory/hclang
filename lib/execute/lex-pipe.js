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
    LexPipe.prototype.finish = function () {
        var output = frames_1.FrameSymbol.end();
        var out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    };
    LexPipe.prototype.parser = function () {
        return this.get(LexPipe.kOUT);
    };
    LexPipe.prototype.perform = function (actions) {
        this.finish();
        return this;
    };
    LexPipe.prototype.next = function () {
        this.finish();
        return this;
    };
    LexPipe.prototype.push = function () {
        var next_parser = this.parser().push();
        this.set(LexPipe.kOUT, next_parser);
        return this;
    };
    LexPipe.prototype.pop = function () {
        var next_parser = this.parser().pop();
        this.set(LexPipe.kOUT, next_parser);
        return this;
    };
    return LexPipe;
}(frames_1.Frame));
exports.LexPipe = LexPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXgtcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSxvQ0FBcUU7QUFFckUsbUNBQWtDO0FBRWxDO0lBQTZCLDJCQUFLO0lBQ2hDLGlCQUFZLEdBQVU7UUFBdEIsaUJBSUM7UUFIQyxlQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUUzQixRQUFBLGtCQUFNLGVBQU0sQ0FBQyxTQUFDOztJQUNoQixDQUFDO0lBRU0sNEJBQVUsR0FBakIsVUFBa0IsS0FBYTtRQUM3QixJQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVNLHFCQUFHLEdBQVYsVUFBVyxNQUFtQjtRQUM1QixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRU0sd0JBQU0sR0FBYjtRQUNFLElBQU0sTUFBTSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVNLHdCQUFNLEdBQWI7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFjLENBQUM7SUFDN0MsQ0FBQztJQUVNLHlCQUFPLEdBQWQsVUFBZSxPQUFnQjtRQUM3QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLHNCQUFJLEdBQVg7UUFDRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLHNCQUFJLEdBQVg7UUFDRSxJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0scUJBQUcsR0FBVjtRQUNFLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FBQyxBQS9DRCxDQUE2QixjQUFLLEdBK0NqQztBQS9DWSwwQkFBTyJ9