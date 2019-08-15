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
var frame_note_1 = require("./frame-note");
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
            return frame_note_1.FrameNote.key(this.data);
        }
    };
    return FrameParam;
}(frame_symbol_1.FrameSymbol));
FrameParam.ARG_CHAR = "^";
FrameParam.params = {};
exports.FrameParam = FrameParam;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1hcmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQWdDO0FBQ2hDLDJDQUF5QztBQUN6QywrQ0FBNkM7QUFFN0M7SUFBOEIsNEJBQVc7SUFtQnZDLGtCQUFzQixJQUFZO2VBQ2hDLGtCQUFNLElBQUksQ0FBQztJQUNiLENBQUM7SUFsQmEsYUFBSSxHQUFsQjtRQUNFLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVhLGNBQUssR0FBbkIsVUFBb0IsS0FBUztRQUFULHNCQUFBLEVBQUEsU0FBUztRQUMzQixJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUlnQixhQUFJLEdBQXJCLFVBQXNCLE1BQWM7UUFDbEMsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFNTSxxQkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDL0IsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDZixNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNuQyxDQUFDO0lBQ0gsQ0FBQztJQUNILGVBQUM7QUFBRCxDQUFDLEFBL0JELENBQThCLDBCQUFXO0FBQ2hCLGlCQUFRLEdBQUcsR0FBRyxDQUFDO0FBV3JCLGFBQUksR0FBaUMsRUFBRSxDQUFDO0FBWjlDLDRCQUFRO0FBK0JwQixDQUFDO0FBRUY7SUFBZ0MsOEJBQVc7SUFtQnpDLG9CQUFzQixJQUFZO2VBQ2hDLGtCQUFNLElBQUksQ0FBQztJQUNiLENBQUM7SUFsQmEsZ0JBQUssR0FBbkI7UUFDRSxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFYSxnQkFBSyxHQUFuQixVQUFvQixLQUFTO1FBQVQsc0JBQUEsRUFBQSxTQUFTO1FBQzNCLElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFJZ0IsZUFBSSxHQUFyQixVQUFzQixNQUFjO1FBQ2xDLElBQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBTU0sdUJBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNuQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLENBQUMsc0JBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBL0JELENBQWdDLDBCQUFXO0FBQ2xCLG1CQUFRLEdBQUcsR0FBRyxDQUFDO0FBV3JCLGlCQUFNLEdBQW1DLEVBQUUsQ0FBQztBQVpsRCxnQ0FBVTtBQStCdEIsQ0FBQyJ9