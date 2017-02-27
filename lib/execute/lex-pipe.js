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
var meta = _.clone(tokens_1.tokens);
_.merge(meta, terminals_1.terminals);
meta[frames_1.Frame.kEND] = terminals_1.Terminal.end();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LXBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9sZXgtcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsb0NBQXFFO0FBQ3JFLHlDQUFrRDtBQUNsRCxtQ0FBa0M7QUFFbEMsSUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFNLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxxQkFBUyxDQUFDLENBQUM7QUFDekIsSUFBSSxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxvQkFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRWxDO0lBQTZCLDJCQUFLO0lBQ2hDLGlCQUFZLEdBQVU7UUFBdEIsaUJBSUM7UUFIQyxJQUFJLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUV2QixRQUFBLGtCQUFNLElBQUksQ0FBQyxTQUFDOztJQUNkLENBQUM7SUFFTSw0QkFBVSxHQUFqQixVQUFrQixLQUFhO1FBQzdCLElBQU0sTUFBTSxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRU0scUJBQUcsR0FBVixVQUFXLE1BQW1CO1FBQzVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFTSx3QkFBTSxHQUFiO1FBQ0UsSUFBTSxNQUFNLEdBQUcsb0JBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNqQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBQ0gsY0FBQztBQUFELENBQUMsQUFyQkQsQ0FBNkIsY0FBSyxHQXFCakM7QUFyQlksMEJBQU8ifQ==