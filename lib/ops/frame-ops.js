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
var frame_curry_1 = require("./frame-curry");
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
            new frame_curry_1.FrameCurry(func, origin),
            frames_1.FrameArg.here(),
        ]);
    };
    return FrameOps;
}(frames_1.Frame));
exports.FrameOps = FrameOps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtb3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wcy9mcmFtZS1vcHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsb0NBQXVEO0FBQ3ZELDZDQUEyRDtBQUkzRDtJQUE4Qiw0QkFBSztJQUNqQyxrQkFBc0IsT0FBaUI7UUFBdkMsWUFDRSxpQkFBTyxTQUNSO1FBRnFCLGFBQU8sR0FBUCxPQUFPLENBQVU7O0lBRXZDLENBQUM7SUFFTSxzQkFBRyxHQUFWLFVBQVcsR0FBVyxFQUFFLE1BQWE7UUFDbkMsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxjQUFLLENBQUMsT0FBTyxDQUFDO0lBQ3ZCLENBQUM7SUFFTSwyQkFBUSxHQUFmO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVTLHdCQUFLLEdBQWYsVUFBZ0IsSUFBb0IsRUFBRSxNQUFhO1FBQ2pELE1BQU0sQ0FBQyxJQUFJLGtCQUFTLENBQUM7WUFDbkIsSUFBSSx3QkFBVSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7WUFDNUIsaUJBQVEsQ0FBQyxJQUFJLEVBQUU7U0FDaEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNILGVBQUM7QUFBRCxDQUFDLEFBeEJELENBQThCLGNBQUssR0F3QmxDO0FBeEJZLDRCQUFRIn0=