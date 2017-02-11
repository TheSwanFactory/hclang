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
var LexTerminal = (function (_super) {
    __extends(LexTerminal, _super);
    function LexTerminal(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        _this.callme = true;
        return _this;
    }
    LexTerminal.prototype.apply = function (argument, parameter) {
        return this.data(argument, parameter);
    };
    LexTerminal.prototype.toData = function () { return this.data; };
    return LexTerminal;
}(frames_1.Frame));
exports.LexTerminal = LexTerminal;
var meta = _.clone(tokens_1.tokens);
_.merge(meta, terminals_1.terminals);
meta[frames_1.Frame.kEND] = new LexTerminal(exports.ender);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3ludGF4L2xleC1waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDBCQUE0QjtBQUM1QixvQ0FBa0c7QUFJbEcseUNBQXdDO0FBQ3hDLG1DQUFrQztBQUVyQixRQUFBLEtBQUssR0FBbUIsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7SUFDbkUsSUFBTSxJQUFJLEdBQUcsTUFBaUIsQ0FBQztJQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUVGO0lBQWlDLCtCQUFLO0lBQ3BDLHFCQUFzQixJQUFvQjtRQUExQyxZQUNFLGtCQUFNLGFBQUksQ0FBQyxTQUVaO1FBSHFCLFVBQUksR0FBSixJQUFJLENBQWdCO1FBRXhDLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDOztJQUNyQixDQUFDO0lBRU0sMkJBQUssR0FBWixVQUFhLFFBQWUsRUFBRSxTQUFnQjtRQUM1QyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVTLDRCQUFNLEdBQWhCLGNBQTBCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvQyxrQkFBQztBQUFELENBQUMsQUFYRCxDQUFpQyxjQUFLLEdBV3JDO0FBWFksa0NBQVc7QUFheEIsSUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFNLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxxQkFBUyxDQUFDLENBQUM7QUFDekIsSUFBSSxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxhQUFLLENBQUMsQ0FBQztBQUUxQztJQUE2QiwyQkFBSztJQUNoQyxpQkFBWSxHQUFVO1FBQXRCLGlCQUlDO1FBSEMsSUFBSSxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFFdkIsUUFBQSxrQkFBTSxJQUFJLENBQUMsU0FBQzs7SUFDZCxDQUFDO0lBRU0sNEJBQVUsR0FBakIsVUFBa0IsS0FBYTtRQUM3QixJQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVNLHFCQUFHLEdBQVYsVUFBVyxNQUFtQjtRQUM1QixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRU0sd0JBQU0sR0FBYjtRQUNFLElBQU0sTUFBTSxHQUFHLG9CQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUNILGNBQUM7QUFBRCxDQUFDLEFBckJELENBQTZCLGNBQUssR0FxQmpDO0FBckJZLDBCQUFPIn0=