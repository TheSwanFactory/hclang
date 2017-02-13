"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("./frames");
var iterators_1 = require("./ops/iterators");
var FrameCurry = (function (_super) {
    __extends(FrameCurry, _super);
    function FrameCurry(Func, Source) {
        var _this = _super.call(this) || this;
        _this.Func = Func;
        _this.Source = Source;
        return _this;
    }
    FrameCurry.prototype.apply = function (argument, parameter) {
        return this.Func(this.Source, argument);
    };
    FrameCurry.prototype.toString = function () {
        return "FrameCurry(" + this.Source + ", " + this.Func + ")";
    };
    return FrameCurry;
}(frames_1.Frame));
var FrameOps = (function (_super) {
    __extends(FrameOps, _super);
    function FrameOps(OpsDict) {
        var _this = _super.call(this) || this;
        _this.OpsDict = OpsDict;
        return _this;
    }
    FrameOps.prototype.get = function (key, origin) {
        var func = this.OpsDict[key];
        if (func != null) {
            return this.curry(func, origin);
        }
        return frames_1.Frame.missing;
    };
    FrameOps.prototype.toString = function () {
        return this.OpsDict.toString();
    };
    FrameOps.prototype.curry = function (func, origin) {
        return new frames_1.FrameExpr([
            new FrameCurry(func, origin),
            frames_1.FrameArg.here(),
        ]);
    };
    return FrameOps;
}(frames_1.Frame));
exports.FrameOps = FrameOps;
exports.Ops = new FrameOps({
    "&&": iterators_1.MetaMap,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxtQ0FBc0Q7QUFDdEQsNkNBQTBDO0FBTTFDO0lBQXlCLDhCQUFLO0lBQzVCLG9CQUFzQixJQUFvQixFQUFZLE1BQWE7UUFBbkUsWUFDRSxpQkFBTyxTQUNSO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQWdCO1FBQVksWUFBTSxHQUFOLE1BQU0sQ0FBTzs7SUFFbkUsQ0FBQztJQUVNLDBCQUFLLEdBQVosVUFBYSxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sNkJBQVEsR0FBZjtRQUNFLE1BQU0sQ0FBQyxnQkFBYyxJQUFJLENBQUMsTUFBTSxVQUFLLElBQUksQ0FBQyxJQUFJLE1BQUcsQ0FBQztJQUNwRCxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBWkQsQ0FBeUIsY0FBSyxHQVk3QjtBQUVEO0lBQThCLDRCQUFLO0lBQ2pDLGtCQUFzQixPQUFpQjtRQUF2QyxZQUNFLGlCQUFPLFNBQ1I7UUFGcUIsYUFBTyxHQUFQLE9BQU8sQ0FBVTs7SUFFdkMsQ0FBQztJQUVNLHNCQUFHLEdBQVYsVUFBVyxHQUFXLEVBQUUsTUFBYTtRQUNuQyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsTUFBTSxDQUFDLGNBQUssQ0FBQyxPQUFPLENBQUM7SUFDdkIsQ0FBQztJQUVNLDJCQUFRLEdBQWY7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRVMsd0JBQUssR0FBZixVQUFnQixJQUFvQixFQUFFLE1BQWE7UUFDakQsTUFBTSxDQUFDLElBQUksa0JBQVMsQ0FBQztZQUNuQixJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO1lBQzVCLGlCQUFRLENBQUMsSUFBSSxFQUFFO1NBQ2hCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQXhCRCxDQUE4QixjQUFLLEdBd0JsQztBQXhCWSw0QkFBUTtBQTBCUixRQUFBLEdBQUcsR0FBRyxJQUFJLFFBQVEsQ0FBQztJQUM5QixJQUFJLEVBQUUsbUJBQU87Q0FDZCxDQUFDLENBQUMifQ==