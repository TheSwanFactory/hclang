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
var ParsePipe = (function (_super) {
    __extends(ParsePipe, _super);
    function ParsePipe(out) {
        var _this = this;
        var meta = {};
        meta[ParsePipe.kOUT] = out;
        meta[frames_1.Frame.kEND] = terminals_1.Terminal.end();
        _this = _super.call(this, [], meta) || this;
        return _this;
    }
    ParsePipe.prototype.push = function () {
        var child = new ParsePipe(this);
        return child;
    };
    ParsePipe.prototype.pop = function () {
        var parent = this.get(ParsePipe.kOUT);
        return parent;
    };
    ParsePipe.prototype.finish = function (argument) {
        var terminal = frames_1.FrameSymbol.end();
        var result = this.makeFrame();
        var out = this.get(frames_1.Frame.kOUT);
        out.call(result);
        out.call(terminal);
        this.reset();
        return result;
    };
    ParsePipe.prototype.makeFrame = function () {
        var current = this.asArray();
        return new frames_1.FrameExpr(current);
    };
    return ParsePipe;
}(frames_1.FrameArray));
exports.ParsePipe = ParsePipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL3BhcnNlLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsb0NBQXNHO0FBQ3RHLHlDQUF1QztBQUV2QztJQUErQiw2QkFBVTtJQUN2QyxtQkFBWSxHQUFVO1FBQXRCLGlCQUtDO1FBSkMsSUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsb0JBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNsQyxRQUFBLGtCQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBQzs7SUFDbEIsQ0FBQztJQUVNLHdCQUFJLEdBQVg7UUFDRSxJQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLHVCQUFHLEdBQVY7UUFDRSxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTSwwQkFBTSxHQUFiLFVBQWMsUUFBZTtRQUMzQixJQUFNLFFBQVEsR0FBRyxvQkFBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ25DLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNoQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pCLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2IsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRVMsNkJBQVMsR0FBbkI7UUFDRSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDL0IsTUFBTSxDQUFDLElBQUksa0JBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBaENELENBQStCLG1CQUFVLEdBZ0N4QztBQWhDWSw4QkFBUyJ9