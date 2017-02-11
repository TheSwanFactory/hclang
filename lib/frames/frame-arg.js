"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frame_1 = require("./frame");
var frame_symbol_1 = require("./frame-symbol");
var FrameArg = (function (_super) {
    __extends(FrameArg, _super);
    function FrameArg(data) {
        return _super.call(this, data) || this;
    }
    FrameArg.here = function () {
        return FrameArg.level();
    };
    FrameArg.level = function (count) {
        if (count === void 0) { count = 1; }
        var symbol = Array(count + 1).join(FrameArg.ARG_CHAR);
        return FrameArg._for(symbol);
    };
    FrameArg._for = function (symbol) {
        var exists = FrameArg.args[symbol];
        return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
    };
    FrameArg.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        var level = this.data.length;
        if (level <= 1) {
            return contexts[0];
        }
        else {
            return FrameArg.level(level - 1);
        }
    };
    return FrameArg;
}(frame_symbol_1.FrameSymbol));
FrameArg.ARG_CHAR = "_";
FrameArg.args = {};
exports.FrameArg = FrameArg;
;
var FrameParam = (function (_super) {
    __extends(FrameParam, _super);
    function FrameParam(data) {
        return _super.call(this, data) || this;
    }
    FrameParam.there = function () {
        return FrameParam.level();
    };
    FrameParam.level = function (count) {
        if (count === void 0) { count = 1; }
        var symbol = FrameArg.ARG_CHAR + Array(count + 1).join(FrameParam.ARG_CHAR);
        return FrameParam._for(symbol);
    };
    FrameParam._for = function (symbol) {
        var exists = FrameParam.params[symbol];
        return exists || (FrameParam.params[symbol] = new FrameParam(symbol));
    };
    FrameParam.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        var level = this.data.length - 1;
        if (level <= contexts.length) {
            return contexts[level];
        }
        else {
            return frame_1.Frame.missing;
        }
    };
    return FrameParam;
}(frame_symbol_1.FrameSymbol));
FrameParam.ARG_CHAR = "^";
FrameParam.params = {};
exports.FrameParam = FrameParam;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1hcmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsaUNBQWdDO0FBQ2hDLCtDQUE2QztBQUU3QztJQUE4Qiw0QkFBVztJQW1CdkMsa0JBQXNCLElBQVk7ZUFDaEMsa0JBQU0sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQWxCYSxhQUFJLEdBQWxCO1FBQ0UsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRWEsY0FBSyxHQUFuQixVQUFvQixLQUFTO1FBQVQsc0JBQUEsRUFBQSxTQUFTO1FBQzNCLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4RCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBSWdCLGFBQUksR0FBckIsVUFBc0IsTUFBYztRQUNsQyxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQU1NLHFCQUFFLEdBQVQsVUFBVSxRQUFzQjtRQUF0Qix5QkFBQSxFQUFBLFlBQVksYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMvQixFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNmLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7SUFDSCxDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUEvQkQsQ0FBOEIsMEJBQVc7QUFDaEIsaUJBQVEsR0FBRyxHQUFHLENBQUM7QUFXckIsYUFBSSxHQUFpQyxFQUFFLENBQUM7QUFaOUMsNEJBQVE7QUErQnBCLENBQUM7QUFFRjtJQUFnQyw4QkFBVztJQW1CekMsb0JBQXNCLElBQVk7ZUFDaEMsa0JBQU0sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQWxCYSxnQkFBSyxHQUFuQjtRQUNFLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVhLGdCQUFLLEdBQW5CLFVBQW9CLEtBQVM7UUFBVCxzQkFBQSxFQUFBLFNBQVM7UUFDM0IsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUlnQixlQUFJLEdBQXJCLFVBQXNCLE1BQWM7UUFDbEMsSUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFNTSx1QkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ25DLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxhQUFLLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLENBQUM7SUFDSCxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBL0JELENBQWdDLDBCQUFXO0FBQ2xCLG1CQUFRLEdBQUcsR0FBRyxDQUFDO0FBV3JCLGlCQUFNLEdBQW1DLEVBQUUsQ0FBQztBQVpsRCxnQ0FBVTtBQStCdEIsQ0FBQyJ9