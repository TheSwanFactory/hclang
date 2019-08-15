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
var frame_1 = require("./frame");
var frame_symbol_1 = require("./frame-symbol");
var frame_note_1 = require("./frame-note");
exports.FrameNote = frame_note_1.FrameNote;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1hcmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQWdDO0FBQ2hDLCtDQUE2QztBQUM3QywyQ0FBeUM7QUFBaEMsaUNBQUEsU0FBUyxDQUFBO0FBRWxCO0lBQThCLDRCQUFXO0lBbUJ2QyxrQkFBc0IsSUFBWTtlQUNoQyxrQkFBTSxJQUFJLENBQUM7SUFDYixDQUFDO0lBbEJhLGFBQUksR0FBbEI7UUFDRSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFYSxjQUFLLEdBQW5CLFVBQW9CLEtBQVM7UUFBVCxzQkFBQSxFQUFBLFNBQVM7UUFDM0IsSUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFJZ0IsYUFBSSxHQUFyQixVQUFzQixNQUFjO1FBQ2xDLElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBTU0scUJBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2YsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkMsQ0FBQztJQUNILENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQS9CRCxDQUE4QiwwQkFBVztBQUNoQixpQkFBUSxHQUFHLEdBQUcsQ0FBQztBQVdyQixhQUFJLEdBQWlDLEVBQUUsQ0FBQztBQVo5Qyw0QkFBUTtBQStCcEIsQ0FBQztBQUVGO0lBQWdDLDhCQUFXO0lBbUJ6QyxvQkFBc0IsSUFBWTtlQUNoQyxrQkFBTSxJQUFJLENBQUM7SUFDYixDQUFDO0lBbEJhLGdCQUFLLEdBQW5CO1FBQ0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRWEsZ0JBQUssR0FBbkIsVUFBb0IsS0FBUztRQUFULHNCQUFBLEVBQUEsU0FBUztRQUMzQixJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5RSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBSWdCLGVBQUksR0FBckIsVUFBc0IsTUFBYztRQUNsQyxJQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQU1NLHVCQUFFLEdBQVQsVUFBVSxRQUFzQjtRQUF0Qix5QkFBQSxFQUFBLFlBQVksYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbkMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxDQUFDLGFBQUssQ0FBQyxPQUFPLENBQUM7UUFDdkIsQ0FBQztJQUNILENBQUM7SUFDSCxpQkFBQztBQUFELENBQUMsQUEvQkQsQ0FBZ0MsMEJBQVc7QUFDbEIsbUJBQVEsR0FBRyxHQUFHLENBQUM7QUFXckIsaUJBQU0sR0FBbUMsRUFBRSxDQUFDO0FBWmxELGdDQUFVO0FBK0J0QixDQUFDIn0=