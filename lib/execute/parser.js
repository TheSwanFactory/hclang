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
var terminals_1 = require("./terminals");
var Parser = (function (_super) {
    __extends(Parser, _super);
    function Parser(out) {
        var _this = this;
        var meta = {};
        meta[Parser.kOUT] = out;
        meta[frames_1.Frame.kEND] = terminals_1.Terminal.end();
        _this = _super.call(this, [], meta) || this;
        return _this;
    }
    Parser.prototype.push = function () {
        var child = new Parser(this);
        return child;
    };
    Parser.prototype.pop = function () {
        var parent = this.get(Parser.kOUT);
        return parent;
    };
    Parser.prototype.finish = function () {
        var terminal = frames_1.FrameSymbol.end();
        var result = this.makeFrame();
        var out = this.get(frames_1.Frame.kOUT);
        out.call(result);
        out.call(terminal);
        this.reset();
        return result;
    };
    Parser.prototype.makeFrame = function () {
        var current = this.asArray();
        return new frames_1.FrameExpr(current);
    };
    return Parser;
}(frames_1.FrameArray));
exports.Parser = Parser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFzRztBQUN0Ryx5Q0FBdUM7QUFFdkM7SUFBNEIsMEJBQVU7SUFDcEMsZ0JBQVksR0FBVTtRQUF0QixpQkFLQztRQUpDLElBQU0sSUFBSSxHQUFZLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUN4QixJQUFJLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLG9CQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbEMsUUFBQSxrQkFBTSxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQUM7O0lBQ2xCLENBQUM7SUFFTSxxQkFBSSxHQUFYO1FBQ0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFTSxvQkFBRyxHQUFWO1FBQ0UsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sdUJBQU0sR0FBYjtRQUNFLElBQU0sUUFBUSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2hDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakIsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFUywwQkFBUyxHQUFuQjtRQUNFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvQixNQUFNLENBQUMsSUFBSSxrQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFDSCxhQUFDO0FBQUQsQ0FBQyxBQWhDRCxDQUE0QixtQkFBVSxHQWdDckM7QUFoQ1ksd0JBQU0ifQ==