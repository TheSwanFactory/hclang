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
        _this.factory = frames_1.FrameExpr;
        return _this;
    }
    ParsePipe.prototype.push = function (argument) {
        var child = new ParsePipe(this);
        return child;
    };
    ParsePipe.prototype.pop = function (argument) {
        var parent = this.get(ParsePipe.kOUT);
        return parent;
    };
    ParsePipe.prototype.finish = function (argument) {
        var terminal = frames_1.FrameSymbol.end();
        var result = this.makeFrame();
        var out = this.get(frames_1.Frame.kOUT);
        var output = out.call(result);
        var finished = out.call(terminal);
        this.reset();
        return result;
    };
    ParsePipe.prototype.makeFrame = function () {
        var current = this.asArray();
        return new this.factory(current);
    };
    return ParsePipe;
}(frames_1.FrameArray));
exports.ParsePipe = ParsePipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL3BhcnNlLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsb0NBQXNHO0FBQ3RHLHlDQUF1QztBQUV2QztJQUErQiw2QkFBVTtJQUd2QyxtQkFBWSxHQUFVO1FBQXRCLGlCQU1DO1FBTEMsSUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsb0JBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNsQyxRQUFBLGtCQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBQztRQUNoQixLQUFJLENBQUMsT0FBTyxHQUFHLGtCQUFTLENBQUM7O0lBQzNCLENBQUM7SUFFTSx3QkFBSSxHQUFYLFVBQVksUUFBZTtRQUN6QixJQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLHVCQUFHLEdBQVYsVUFBVyxRQUFlO1FBQ3hCLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVNLDBCQUFNLEdBQWIsVUFBYyxRQUFlO1FBQzNCLElBQU0sUUFBUSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2hDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEMsSUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFUyw2QkFBUyxHQUFuQjtRQUNFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvQixNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFuQ0QsQ0FBK0IsbUJBQVUsR0FtQ3hDO0FBbkNZLDhCQUFTIn0=