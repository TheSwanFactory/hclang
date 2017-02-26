"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var frames_1 = require("../frames");
var terminals_1 = require("./terminals");
var tokens_1 = require("./tokens");
exports.ender = function (source, parameter) {
    var pipe = source;
    return pipe.finish();
};
var meta = _.clone(tokens_1.tokens);
_.merge(meta, terminals_1.terminals);
meta[frames_1.Frame.kEND] = new terminals_1.LexTerminal(exports.ender);
var LexPipe = (function (_super) {
    __extends(LexPipe, _super);
    function LexPipe(out) {
        var _this = this;
        meta[frames_1.Frame.kOUT] = out;
        _this = _super.call(this, meta) || this;
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
    return LexPipe;
}(frames_1.Frame));
exports.LexPipe = LexPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXgtcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsb0NBQWtHO0FBRWxHLHlDQUFxRDtBQUNyRCxtQ0FBa0M7QUFFckIsUUFBQSxLQUFLLEdBQW1CLFVBQUMsTUFBYSxFQUFFLFNBQWdCO0lBQ25FLElBQU0sSUFBSSxHQUFHLE1BQWlCLENBQUM7SUFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFFRixJQUFNLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQU0sQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLHFCQUFTLENBQUMsQ0FBQztBQUN6QixJQUFJLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksdUJBQVcsQ0FBQyxhQUFLLENBQUMsQ0FBQztBQUUxQztJQUE2QiwyQkFBSztJQUNoQyxpQkFBWSxHQUFVO1FBQXRCLGlCQUlDO1FBSEMsSUFBSSxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFFdkIsUUFBQSxrQkFBTSxJQUFJLENBQUMsU0FBQzs7SUFDZCxDQUFDO0lBRU0sNEJBQVUsR0FBakIsVUFBa0IsS0FBYTtRQUM3QixJQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVNLHFCQUFHLEdBQVYsVUFBVyxNQUFtQjtRQUM1QixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRU0sd0JBQU0sR0FBYjtRQUNFLElBQU0sTUFBTSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUNILGNBQUM7QUFBRCxDQUFDLEFBckJELENBQTZCLGNBQUssR0FxQmpDO0FBckJZLDBCQUFPIn0=